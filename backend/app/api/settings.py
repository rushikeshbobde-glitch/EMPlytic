from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, AuditLog
from app.core.security import get_current_user, require_hr

router = APIRouter(
    prefix="/api/settings",
    tags=["Settings & Preferences"]
)

# In-memory / config organization settings fallback
ORG_SETTINGS = {
    "organization_name": "EMPlytic Global Enterprise",
    "industry": "Technology & Professional Services",
    "primary_contact": "hr-admin@emplytic.com",
    "timezone": "UTC-5 (Eastern Time)",
    "currency": "USD ($)",
    "security": {
        "mfa_enforced": False,
        "session_timeout_minutes": 1440,
        "password_expiry_days": 90
    },
    "notifications": {
        "email_alerts": True,
        "weekly_digest": True,
        "attrition_spikes": True,
        "data_processing_complete": True
    },
    "preferences": {
        "theme": "light",
        "default_view": "executive",
        "data_retention_months": 24
    }
}

class UpdateSettingsRequest(BaseModel):
    organization_name: Optional[str] = None
    industry: Optional[str] = None
    primary_contact: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    security: Optional[Dict[str, Any]] = None
    notifications: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None

@router.get("")
def get_settings(current_user: User = Depends(get_current_user)):
    """Returns organizational and user profile settings."""
    return {
        "success": True,
        "settings": ORG_SETTINGS,
        "user_profile": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "employee_id": current_user.employee_id
        }
    }

@router.put("")
def update_settings(
    data: UpdateSettingsRequest,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Updates settings and records audit log."""
    if data.organization_name:
        ORG_SETTINGS["organization_name"] = data.organization_name
    if data.industry:
        ORG_SETTINGS["industry"] = data.industry
    if data.primary_contact:
        ORG_SETTINGS["primary_contact"] = data.primary_contact
    if data.timezone:
        ORG_SETTINGS["timezone"] = data.timezone
    if data.currency:
        ORG_SETTINGS["currency"] = data.currency
    if data.security:
        ORG_SETTINGS["security"].update(data.security)
    if data.notifications:
        ORG_SETTINGS["notifications"].update(data.notifications)
    if data.preferences:
        ORG_SETTINGS["preferences"].update(data.preferences)

    db.add(AuditLog(user_id=current_user.id, action="SETTINGS_UPDATED", details="Organization settings modified"))
    db.commit()

    return {
        "success": True,
        "message": "Settings saved successfully",
        "settings": ORG_SETTINGS
    }

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_hr),
    db: Session = Depends(get_db)
):
    """Retrieves recent audit logs for HR administrators."""
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    return {
        "success": True,
        "count": len(logs),
        "data": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "action": l.action,
                "details": l.details,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None
            }
            for l in logs
        ]
    }
