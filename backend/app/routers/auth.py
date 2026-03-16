from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, UserRole
from ..models.login_attempt import LoginAttempt
from ..models.notification import Notification
from ..schemas.user import UserCreate, UserResponse, Token, LoginRequest
from ..utils.security import hash_password, verify_password, create_access_token
from ..services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=UserRole.USER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Welcome notification
    notif = Notification(
        user_id=user.id,
        title="Welcome to TruMonix!",
        message="Your account is set up. Start submitting transactions to see the risk engine in action.",
        type="INFO",
    )
    db.add(notif)
    db.commit()

    log_action(
        db, action="USER_REGISTERED", user_id=user.id,
        entity_type="user", entity_id=user.id,
        details={"username": user.username, "email": user.email},
        ip_address=request.client.host if request.client else None,
    )
    return user


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    user = db.query(User).filter(User.username == credentials.username).first()

    # Record login attempt
    attempt = LoginAttempt(
        username=credentials.username,
        ip_address=ip,
        success=False,
        failure_reason=None,
    )

    if not user:
        attempt.failure_reason = "user_not_found"
        db.add(attempt)
        db.commit()
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    if not verify_password(credentials.password, user.hashed_password):
        attempt.failure_reason = "wrong_password"
        db.add(attempt)
        db.commit()
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    if not user.is_active:
        attempt.failure_reason = "account_inactive"
        db.add(attempt)
        db.commit()
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Successful login
    attempt.success = True
    db.add(attempt)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    log_action(
        db, action="USER_LOGIN", user_id=user.id,
        entity_type="user", entity_id=user.id,
        details={"username": user.username},
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
    )
    return {"access_token": token, "token_type": "bearer", "user": user}