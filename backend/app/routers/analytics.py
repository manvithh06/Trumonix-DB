from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from ..database import get_db
from ..models.transaction import Transaction, TransactionStatus
from ..models.user import User
from ..services.auth_service import get_current_user, get_current_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """7-day transaction trend for current user."""
    from ..models.user import UserRole
    base = db.query(Transaction)
    if current_user.role != UserRole.ADMIN:
        base = base.filter(Transaction.user_id == current_user.id)

    since = datetime.utcnow() - timedelta(days=7)
    daily = []
    for i in range(7):
        day = since + timedelta(days=i)
        day_end = day + timedelta(days=1)
        count = base.filter(Transaction.created_at >= day, Transaction.created_at < day_end).count()
        total_amt = db.query(func.sum(Transaction.amount)).filter(
            Transaction.created_at >= day,
            Transaction.created_at < day_end,
            *([] if current_user.role == UserRole.ADMIN else [Transaction.user_id == current_user.id]),
        ).scalar() or 0
        daily.append({
            "date": day.strftime("%b %d"),
            "count": count,
            "amount": round(total_amt, 2),
        })
    return daily


@router.get("/risk-distribution")
def get_risk_distribution(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin: risk score histogram in buckets of 10."""
    buckets = []
    for i in range(0, 100, 10):
        count = db.query(Transaction).filter(
            Transaction.risk_score >= i,
            Transaction.risk_score < i + 10,
        ).count()
        buckets.append({"range": f"{i}-{i+10}", "count": count})
    return buckets


@router.get("/top-risk-factors")
def get_top_risk_factors(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin: most frequently triggered risk factors."""
    flagged_blocked = db.query(Transaction).filter(
        Transaction.status.in_([TransactionStatus.FLAGGED, TransactionStatus.BLOCKED])
    ).all()

    factor_counts: dict[str, int] = {}
    for txn in flagged_blocked:
        if txn.risk_factors:
            for f in txn.risk_factors:
                name = f.get("factor", "UNKNOWN")
                factor_counts[name] = factor_counts.get(name, 0) + 1

    sorted_factors = sorted(factor_counts.items(), key=lambda x: x[1], reverse=True)
    return [{"factor": k, "count": v} for k, v in sorted_factors[:10]]


@router.get("/recent-alerts")
def get_recent_alerts(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin: last 10 blocked/flagged transactions."""
    alerts = (
        db.query(Transaction)
        .filter(Transaction.status.in_([TransactionStatus.FLAGGED, TransactionStatus.BLOCKED]))
        .order_by(desc(Transaction.created_at))
        .limit(10)
        .all()
    )
    return [
        {
            "id": t.id,
            "ref": t.transaction_ref,
            "amount": t.amount,
            "merchant": t.merchant,
            "status": t.status.value,
            "risk_score": t.risk_score,
            "created_at": t.created_at.isoformat(),
        }
        for t in alerts
    ]
