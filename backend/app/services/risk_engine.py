"""
TruMonix Risk Engine
====================
Zero-Trust transaction risk scoring engine.

Every transaction is treated as potentially risky and evaluated
across multiple behavioral, contextual, and rule-based dimensions.

Risk score: 0–100
  0–30  → APPROVED
  31–70 → FLAGGED (manual review)
  71–100 → BLOCKED
"""

from typing import List, Tuple, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.transaction import Transaction, TransactionStatus
from ..models.user import User
from ..config import settings


HIGH_RISK_CATEGORIES = {"gambling", "crypto", "forex", "wire_transfer", "adult"}
ELEVATED_RISK_CATEGORIES = {"entertainment", "travel"}

# Velocity thresholds
MAX_TRANSACTIONS_PER_HOUR = 5
MAX_TRANSACTIONS_PER_DAY = 20
HIGH_AMOUNT_THRESHOLD = 10_000
ELEVATED_AMOUNT_THRESHOLD = 5_000
VELOCITY_AMOUNT_WINDOW_HOURS = 1
MAX_VELOCITY_AMOUNT = 20_000


def _get_user_history(db: Session, user_id: int, limit: int = 50) -> List[Transaction]:
    """Fetch recent approved/flagged transactions to build behavioral baseline."""
    return (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.status.in_([TransactionStatus.APPROVED, TransactionStatus.FLAGGED]),
        )
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .all()
    )


def _get_recent_transactions(
    db: Session, user_id: int, hours: int = 1
) -> List[Transaction]:
    """Transactions in the last N hours (for velocity checks)."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    return (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.created_at >= cutoff,
        )
        .all()
    )


def _get_daily_transactions(db: Session, user_id: int) -> List[Transaction]:
    cutoff = datetime.utcnow() - timedelta(hours=24)
    return (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.created_at >= cutoff,
        )
        .all()
    )


def calculate_risk_score(
    transaction_data: dict,
    user: User,
    db: Session,
) -> Tuple[float, List[dict], TransactionStatus]:
    """
    Main risk scoring function.

    Returns:
        (risk_score: float, risk_factors: List[dict], decision: TransactionStatus)
    """
    score = 0.0
    factors = []

    amount = transaction_data["amount"]
    merchant_category = (transaction_data.get("merchant_category") or "other").lower()
    device_id = transaction_data.get("device_id")
    location = transaction_data.get("location")

    # ─── 1. HIGH-VALUE TRANSACTION ────────────────────────────────────────────
    if amount >= HIGH_AMOUNT_THRESHOLD:
        weight = 25
        score += weight
        factors.append({
            "factor": "HIGH_VALUE_TRANSACTION",
            "detail": f"Amount ${amount:,.2f} exceeds high-value threshold of ${HIGH_AMOUNT_THRESHOLD:,}",
            "weight": weight,
            "severity": "high",
        })
    elif amount >= ELEVATED_AMOUNT_THRESHOLD:
        weight = 10
        score += weight
        factors.append({
            "factor": "ELEVATED_VALUE_TRANSACTION",
            "detail": f"Amount ${amount:,.2f} is above normal range",
            "weight": weight,
            "severity": "medium",
        })

    # ─── 2. BEHAVIORAL BASELINE — AMOUNT DEVIATION ───────────────────────────
    history = _get_user_history(db, user.id)
    if history:
        historical_amounts = [t.amount for t in history]
        avg_amount = sum(historical_amounts) / len(historical_amounts)
        if avg_amount > 0:
            deviation_ratio = amount / avg_amount
            if deviation_ratio > 10:
                weight = 30
                score += weight
                factors.append({
                    "factor": "EXTREME_AMOUNT_DEVIATION",
                    "detail": f"Amount is {deviation_ratio:.1f}x your historical average (${avg_amount:,.2f})",
                    "weight": weight,
                    "severity": "high",
                })
            elif deviation_ratio > 5:
                weight = 20
                score += weight
                factors.append({
                    "factor": "HIGH_AMOUNT_DEVIATION",
                    "detail": f"Amount is {deviation_ratio:.1f}x your historical average (${avg_amount:,.2f})",
                    "weight": weight,
                    "severity": "medium",
                })
            elif deviation_ratio > 3:
                weight = 10
                score += weight
                factors.append({
                    "factor": "MODERATE_AMOUNT_DEVIATION",
                    "detail": f"Amount is {deviation_ratio:.1f}x your historical average",
                    "weight": weight,
                    "severity": "low",
                })

    # ─── 3. HIGH-RISK MERCHANT CATEGORY ──────────────────────────────────────
    if merchant_category in HIGH_RISK_CATEGORIES:
        weight = 20
        score += weight
        factors.append({
            "factor": "HIGH_RISK_MERCHANT_CATEGORY",
            "detail": f"Merchant category '{merchant_category}' is classified as high risk",
            "weight": weight,
            "severity": "high",
        })
    elif merchant_category in ELEVATED_RISK_CATEGORIES:
        weight = 5
        score += weight
        factors.append({
            "factor": "ELEVATED_RISK_MERCHANT",
            "detail": f"Merchant category '{merchant_category}' is elevated risk",
            "weight": weight,
            "severity": "low",
        })

    # ─── 4. TRANSACTION VELOCITY (hourly) ────────────────────────────────────
    recent_txns = _get_recent_transactions(db, user.id, hours=1)
    if len(recent_txns) >= MAX_TRANSACTIONS_PER_HOUR:
        weight = 20
        score += weight
        factors.append({
            "factor": "HIGH_TRANSACTION_FREQUENCY",
            "detail": f"{len(recent_txns)} transactions in the past hour (threshold: {MAX_TRANSACTIONS_PER_HOUR})",
            "weight": weight,
            "severity": "high",
        })
    elif len(recent_txns) >= MAX_TRANSACTIONS_PER_HOUR - 2:
        weight = 10
        score += weight
        factors.append({
            "factor": "ELEVATED_TRANSACTION_FREQUENCY",
            "detail": f"{len(recent_txns)} transactions in the past hour",
            "weight": weight,
            "severity": "medium",
        })

    # ─── 5. DAILY VELOCITY AMOUNT ────────────────────────────────────────────
    recent_velocity = _get_recent_transactions(db, user.id, hours=VELOCITY_AMOUNT_WINDOW_HOURS)
    velocity_total = sum(t.amount for t in recent_velocity) + amount
    if velocity_total > MAX_VELOCITY_AMOUNT:
        weight = 20
        score += weight
        factors.append({
            "factor": "VELOCITY_AMOUNT_EXCEEDED",
            "detail": f"Total spend in last {VELOCITY_AMOUNT_WINDOW_HOURS}h would be ${velocity_total:,.2f} (limit: ${MAX_VELOCITY_AMOUNT:,})",
            "weight": weight,
            "severity": "high",
        })

    # ─── 6. UNKNOWN DEVICE ────────────────────────────────────────────────────
    if device_id and history:
        known_devices = {t.device_id for t in history if t.device_id}
        if known_devices and device_id not in known_devices:
            weight = 15
            score += weight
            factors.append({
                "factor": "UNKNOWN_DEVICE",
                "detail": "Transaction initiated from an unrecognized device",
                "weight": weight,
                "severity": "medium",
            })

    # ─── 7. LOCATION ANOMALY ─────────────────────────────────────────────────
    if location and history:
        known_locations = {t.location for t in history if t.location}
        if known_locations and location not in known_locations:
            weight = 15
            score += weight
            factors.append({
                "factor": "LOCATION_ANOMALY",
                "detail": f"Transaction from new location: {location}",
                "weight": weight,
                "severity": "medium",
            })

    # ─── 8. ODD HOURS (midnight to 5am UTC) ──────────────────────────────────
    current_hour = datetime.utcnow().hour
    if 0 <= current_hour < 5:
        weight = 10
        score += weight
        factors.append({
            "factor": "ODD_TRANSACTION_HOURS",
            "detail": f"Transaction initiated at {current_hour:02d}:00 UTC (unusual hours: 00:00–05:00)",
            "weight": weight,
            "severity": "low",
        })

    # ─── 9. FIRST TRANSACTION (new account risk) ─────────────────────────────
    if not history and user.total_transactions == 0:
        weight = 5
        score += weight
        factors.append({
            "factor": "FIRST_TRANSACTION",
            "detail": "No transaction history available for behavioral baseline",
            "weight": weight,
            "severity": "low",
        })

    # ─── CLAMP SCORE ─────────────────────────────────────────────────────────
    final_score = min(round(score, 2), 100.0)

    # ─── DECISION ────────────────────────────────────────────────────────────
    if final_score >= settings.RISK_BLOCK_THRESHOLD:
        decision = TransactionStatus.BLOCKED
    elif final_score >= settings.RISK_FLAG_THRESHOLD:
        decision = TransactionStatus.FLAGGED
    else:
        decision = TransactionStatus.APPROVED

    return final_score, factors, decision
