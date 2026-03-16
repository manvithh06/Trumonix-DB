from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.blacklisted_merchant import BlacklistedMerchant
from ..schemas.blacklisted_merchant import BlacklistCreate, BlacklistResponse
from ..services.auth_service import get_current_admin
from ..services.audit_service import log_action

router = APIRouter(prefix="/blacklist", tags=["Blacklist"])


@router.get("/", response_model=List[BlacklistResponse])
def get_blacklist(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return db.query(BlacklistedMerchant).order_by(desc(BlacklistedMerchant.created_at)).all()


@router.post("/", response_model=BlacklistResponse, status_code=201)
def add_to_blacklist(
    data: BlacklistCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    existing = db.query(BlacklistedMerchant).filter(
        BlacklistedMerchant.merchant.ilike(data.merchant)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Merchant already blacklisted")

    entry = BlacklistedMerchant(
        merchant=data.merchant,
        reason=data.reason,
        added_by=admin.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    log_action(
        db, action="MERCHANT_BLACKLISTED",
        user_id=admin.id,
        entity_type="blacklist", entity_id=entry.id,
        details={"merchant": data.merchant, "reason": data.reason},
        ip_address=request.client.host if request.client else None,
    )
    return entry


@router.delete("/{entry_id}", status_code=204)
def remove_from_blacklist(
    entry_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    entry = db.query(BlacklistedMerchant).filter(BlacklistedMerchant.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()