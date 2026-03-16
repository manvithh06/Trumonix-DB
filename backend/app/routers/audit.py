from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from math import ceil

from ..database import get_db
from ..models.audit_log import AuditLog
from ..models.user import User
from ..schemas.audit_log import AuditLogResponse, PaginatedAuditLogs
from ..services.auth_service import get_current_user, get_current_admin

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/my", response_model=PaginatedAuditLogs)
def get_my_audit_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AuditLog).filter(AuditLog.user_id == current_user.id)
    total = query.count()
    items = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.get("/all", response_model=PaginatedAuditLogs)
def get_all_audit_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=30, ge=1, le=100),
    action_filter: Optional[str] = Query(default=None),
    user_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    query = db.query(AuditLog)
    if action_filter:
        query = query.filter(AuditLog.action.ilike(f"%{action_filter}%"))
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    total = query.count()
    items = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"items": items, "total": total, "page": page, "per_page": per_page}
