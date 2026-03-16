from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class BlacklistedMerchant(Base):
    __tablename__ = "blacklisted_merchants"

    id         = Column(Integer, primary_key=True, index=True)
    merchant   = Column(String(100), unique=True, nullable=False)
    reason     = Column(String(500))
    added_by   = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("User")