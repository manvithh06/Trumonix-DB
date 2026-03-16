from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedNotifications(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread: int