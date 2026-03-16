from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BlacklistCreate(BaseModel):
    merchant: str = Field(..., min_length=1, max_length=100)
    reason: Optional[str] = None


class BlacklistResponse(BaseModel):
    id: int
    merchant: str
    reason: Optional[str] = None
    added_by: int
    created_at: datetime

    class Config:
        from_attributes = True