from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey,
    Enum as SAEnum, JSON, Text, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class TransactionStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    FLAGGED = "FLAGGED"
    BLOCKED = "BLOCKED"
    PENDING = "PENDING"


class MerchantCategory(str, enum.Enum):
    RETAIL = "retail"
    FOOD = "food"
    TRAVEL = "travel"
    ENTERTAINMENT = "entertainment"
    HEALTHCARE = "healthcare"
    UTILITIES = "utilities"
    GAMBLING = "gambling"
    CRYPTO = "crypto"
    FOREX = "forex"
    WIRE_TRANSFER = "wire_transfer"
    ADULT = "adult"
    OTHER = "other"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_ref = Column(String(20), unique=True, index=True, nullable=False)

    # Parties
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_name = Column(String(100))
    recipient_account = Column(String(50))

    # Transaction details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    merchant = Column(String(100), nullable=False)
    merchant_category = Column(String(50), default="other")
    description = Column(Text)

    # Device & location (Zero-Trust context)
    device_id = Column(String(255))
    ip_address = Column(String(45))
    location = Column(String(100))
    user_agent = Column(Text)

    # Risk assessment
    status = Column(SAEnum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    risk_factors = Column(JSON, default=list)  # List of triggered risk factors
    is_manual_override = Column(Boolean, default=False)

    # Review
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(Integer, ForeignKey("users.id"))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="transactions")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_transactions")
    audit_logs = relationship("AuditLog", back_populates="transaction")
