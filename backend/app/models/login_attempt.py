from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..database import Base


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id             = Column(Integer, primary_key=True, index=True)
    username       = Column(String(50), nullable=False)
    ip_address     = Column(String(45))
    success        = Column(Boolean, nullable=False)
    failure_reason = Column(String(100))
    attempted_at   = Column(DateTime(timezone=True), server_default=func.now())