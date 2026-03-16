import random
import string
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from math import ceil

from ..database import get_db
from ..models.user import User
from ..models.transaction import Transaction, TransactionStatus
from ..schemas.transaction import (
    TransactionCreate, TransactionResponse, TransactionReview,
    TransactionSummary, PaginatedTransactions,
)
from ..services.auth_service import get_current_user, get_current_admin
from ..services.risk_engine import calculate_risk_score
from ..services.audit_service import log_action

router = APIRouter(prefix="/transactions", tags=["Transactions"])


def _generate_ref() -> str:
    """Generate a unique transaction reference like TRX-A3F9B2."""
    return "TRX-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    txn_data: TransactionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a transaction for risk evaluation."""
    # Auto-fill IP from request if not provided
    ip_address = txn_data.ip_address or (request.client.host if request.client else None)

    data_dict = txn_data.model_dump()
    data_dict["ip_address"] = ip_address

    # Run risk engine
    risk_score, risk_factors, decision = calculate_risk_score(data_dict, current_user, db)

    # Generate unique ref
    ref = _generate_ref()
    while db.query(Transaction).filter(Transaction.transaction_ref == ref).first():
        ref = _generate_ref()

    txn = Transaction(
        transaction_ref=ref,
        user_id=current_user.id,
        amount=txn_data.amount,
        currency=txn_data.currency,
        merchant=txn_data.merchant,
        merchant_category=txn_data.merchant_category,
        description=txn_data.description,
        recipient_name=txn_data.recipient_name,
        recipient_account=txn_data.recipient_account,
        device_id=txn_data.device_id,
        ip_address=ip_address,
        location=txn_data.location,
        status=decision,
        risk_score=risk_score,
        risk_factors=risk_factors,
    )
    db.add(txn)

    # Update user profile stats
    current_user.total_transactions += 1
    if txn_data.device_id:
        current_user.last_device_id = txn_data.device_id
    if txn_data.location:
        current_user.last_location = txn_data.location

    # Update rolling average amount
    if current_user.total_transactions > 1:
        current_user.average_transaction_amount = (
            (current_user.average_transaction_amount * (current_user.total_transactions - 1) + txn_data.amount)
            / current_user.total_transactions
        )
    else:
        current_user.average_transaction_amount = txn_data.amount

    db.commit()
    db.refresh(txn)

    log_action(
        db, action=f"TRANSACTION_{decision.value}",
        user_id=current_user.id, transaction_id=txn.id,
        entity_type="transaction", entity_id=txn.id,
        details={
            "ref": ref, "amount": txn_data.amount,
            "risk_score": risk_score, "decision": decision.value,
            "factors": [f["factor"] for f in risk_factors],
        },
        ip_address=ip_address,
        user_agent=request.headers.get("user-agent"),
    )
    return txn


@router.get("/my", response_model=PaginatedTransactions)
def get_my_transactions(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if status_filter:
        try:
            query = query.filter(Transaction.status == TransactionStatus(status_filter.upper()))
        except ValueError:
            pass
    total = query.count()
    items = query.order_by(desc(Transaction.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": items, "total": total, "page": page,
        "per_page": per_page, "pages": ceil(total / per_page) if total else 1,
    }


@router.get("/my/summary", response_model=TransactionSummary)
def get_my_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txns = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    return {
        "total": len(txns),
        "approved": sum(1 for t in txns if t.status == TransactionStatus.APPROVED),
        "flagged": sum(1 for t in txns if t.status == TransactionStatus.FLAGGED),
        "blocked": sum(1 for t in txns if t.status == TransactionStatus.BLOCKED),
        "pending": sum(1 for t in txns if t.status == TransactionStatus.PENDING),
        "total_amount": sum(t.amount for t in txns),
        "avg_risk_score": (sum(t.risk_score for t in txns) / len(txns)) if txns else 0.0,
    }


@router.get("/all", response_model=PaginatedTransactions)
def get_all_transactions(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None),
    user_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin: get all transactions across all users."""
    query = db.query(Transaction)
    if status_filter:
        try:
            query = query.filter(Transaction.status == TransactionStatus(status_filter.upper()))
        except ValueError:
            pass
    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    total = query.count()
    items = query.order_by(desc(Transaction.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": items, "total": total, "page": page,
        "per_page": per_page, "pages": ceil(total / per_page) if total else 1,
    }


@router.get("/admin/summary", response_model=TransactionSummary)
def get_admin_summary(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    txns = db.query(Transaction).all()
    return {
        "total": len(txns),
        "approved": sum(1 for t in txns if t.status == TransactionStatus.APPROVED),
        "flagged": sum(1 for t in txns if t.status == TransactionStatus.FLAGGED),
        "blocked": sum(1 for t in txns if t.status == TransactionStatus.BLOCKED),
        "pending": sum(1 for t in txns if t.status == TransactionStatus.PENDING),
        "total_amount": sum(t.amount for t in txns),
        "avg_risk_score": (sum(t.risk_score for t in txns) / len(txns)) if txns else 0.0,
    }


@router.get("/{txn_id}", response_model=TransactionResponse)
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    from ..models.user import UserRole
    if txn.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    return txn


@router.patch("/{txn_id}/review", response_model=TransactionResponse)
def review_transaction(
    txn_id: int,
    review: TransactionReview,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: manually approve or block a flagged transaction."""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status not in [TransactionStatus.FLAGGED, TransactionStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Only FLAGGED or PENDING transactions can be reviewed")

    from datetime import datetime
    old_status = txn.status
    txn.status = review.status
    txn.reviewed_by = admin.id
    txn.reviewed_at = datetime.utcnow()
    txn.is_manual_override = True
    db.commit()
    db.refresh(txn)

    log_action(
        db, action="TRANSACTION_REVIEWED",
        user_id=admin.id, transaction_id=txn.id,
        entity_type="transaction", entity_id=txn.id,
        details={
            "old_status": old_status.value,
            "new_status": review.status.value,
            "note": review.note,
        },
        ip_address=request.client.host if request.client else None,
    )
    return txn



@router.delete("/{txn_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Admin: permanently delete a transaction."""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.add(txn)

    # ── Send notification based on decision ──────────────────────────────
    from ..models.notification import Notification
    notif_map = {
        "APPROVED": ("✅ Transaction Approved",  f"Your transaction of ${txn_data.amount:,.2f} at {txn_data.merchant} was approved. Risk score: {risk_score:.0f}"),
        "FLAGGED":  ("⚠️ Transaction Flagged",   f"Your transaction of ${txn_data.amount:,.2f} at {txn_data.merchant} has been flagged for review. Risk score: {risk_score:.0f}"),
        "BLOCKED":  ("🚫 Transaction Blocked",   f"Your transaction of ${txn_data.amount:,.2f} at {txn_data.merchant} was blocked due to high risk. Risk score: {risk_score:.0f}"),
    }
    title, message = notif_map.get(decision.value, ("Transaction Update", "Your transaction was processed."))
    notif = Notification(
        user_id=current_user.id,
        title=title,
        message=message,
        type=decision.value,
    )
    db.add(notif)
    
    db.commit()
