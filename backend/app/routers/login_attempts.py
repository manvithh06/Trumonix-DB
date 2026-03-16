from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from math import ceil
from ..database import get_db
from ..models.user import User
from ..models.login_attempt import LoginAttempt
from ..schemas.login_attempt import PaginatedLoginAttempts
from ..services.auth_service import get_current_admin

router = APIRouter(prefix="/login-attempts", tags=["Login Attempts"])


@router.get("/", response_model=PaginatedLoginAttempts)
def get_login_attempts(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    failed_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    query = db.query(LoginAttempt)
    if failed_only:
        query = query.filter(LoginAttempt.success == False)
    total = query.count()
    failed = db.query(LoginAttempt).filter(LoginAttempt.success == False).count()
    items = query.order_by(desc(LoginAttempt.attempted_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {"items": items, "total": total, "failed": failed}