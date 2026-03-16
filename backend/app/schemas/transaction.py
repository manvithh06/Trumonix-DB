from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from ..models.transaction import TransactionStatus


class RiskFactor(BaseModel):
    factor: str
    detail: str
    weight: float


class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount (must be positive)")
    currency: str = Field(default="USD", max_length=3)
    merchant: str = Field(..., min_length=1, max_length=100)
    merchant_category: str = Field(default="other")
    description: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_account: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    transaction_ref: str
    user_id: int
    amount: float
    currency: str
    merchant: str
    merchant_category: str
    description: Optional[str] = None
    recipient_name: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    status: TransactionStatus
    risk_score: float
    risk_factors: Optional[List[Any]] = []
    is_manual_override: bool
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionReview(BaseModel):
    status: TransactionStatus
    note: Optional[str] = None


class TransactionSummary(BaseModel):
    total: int
    approved: int
    flagged: int
    blocked: int
    pending: int
    total_amount: float
    avg_risk_score: float


class PaginatedTransactions(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    per_page: int
    pages: int
