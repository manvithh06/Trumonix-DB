from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    transaction_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedAuditLogs(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    per_page: int
