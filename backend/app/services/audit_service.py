from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from ..models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    transaction_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """Create an immutable audit log entry."""
    log = AuditLog(
        action=action,
        user_id=user_id,
        transaction_id=transaction_id,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
