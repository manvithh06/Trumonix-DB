from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base

# ─── Register ALL models so tables are created ────────────────────────────────
from .models import User, Transaction, AuditLog
from .models.notification import Notification
from .models.blacklisted_merchant import BlacklistedMerchant
from .models.login_attempt import LoginAttempt

# ─── Import ALL routers ───────────────────────────────────────────────────────
from .routers.auth import router as auth_router
from .routers.transactions import router as transactions_router
from .routers.users import router as users_router
from .routers.audit import router as audit_router
from .routers.analytics import router as analytics_router
from .routers.notifications import router as notifications_router
from .routers.blacklist import router as blacklist_router
from .routers.login_attempts import router as login_attempts_router

from .utils.security import hash_password

# ─── Create all tables ────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Zero-Trust Smart Transaction Surveillance System",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router,             prefix="/api/v1")
app.include_router(transactions_router,     prefix="/api/v1")
app.include_router(users_router,            prefix="/api/v1")
app.include_router(audit_router,            prefix="/api/v1")
app.include_router(analytics_router,        prefix="/api/v1")
app.include_router(notifications_router,    prefix="/api/v1")
app.include_router(blacklist_router,        prefix="/api/v1")
app.include_router(login_attempts_router,   prefix="/api/v1")


@app.get("/")
def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ─── Seed admin on startup ────────────────────────────────────────────────────
@app.on_event("startup")
def seed_admin():
    from .database import SessionLocal
    from .models.user import User, UserRole

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            admin = User(
                email="admin@trumonix.io",
                username="admin",
                full_name="TruMonix Admin",
                hashed_password=hash_password("Admin@123"),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.commit()
            print("✅ Admin seeded: username=admin, password=Admin@123")
    finally:
        db.close()