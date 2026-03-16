from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LoginAttemptResponse(BaseModel):
    id: int
    username: str
    ip_address: Optional[str] = None
    success: bool
    failure_reason: Optional[str] = None
    attempted_at: datetime

    class Config:
        from_attributes = True


class PaginatedLoginAttempts(BaseModel):
    items: list[LoginAttemptResponse]
    total: int
    failed: int