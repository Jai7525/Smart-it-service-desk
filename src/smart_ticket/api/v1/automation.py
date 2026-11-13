from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid

from smart_ticket.core.database import get_session
from smart_ticket.core.security import require_roles, get_current_user
from smart_ticket.models import AutomationRule, AutomationLog, Profile, UserRole

router = APIRouter(prefix="/automation", tags=["Workflow Automation"])


class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger: str  # "ticket_created", "status_changed", "sla_warning"
    conditions: Dict[str, Any] = {}
    actions: List[Dict[str, Any]] = []
    is_active: bool = True


class RuleRead(RuleCreate):
    id: uuid.UUID

    class Config:
        from_attributes = True


class LogRead(BaseModel):
    id: uuid.UUID
    rule_id: Optional[uuid.UUID]
    trigger: str
    incident_id: Optional[uuid.UUID]
    action_taken: str
    status: str
    details: Optional[str]

    class Config:
        from_attributes = True


@router.post("/rules", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
def create_automation_rule(
    rule_in: RuleCreate,
    current_user: Profile = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
    session: Session = Depends(get_session)
):
    """
    FR-13: Create configurable Trigger-Condition-Action automation rules.
    """
    rule = AutomationRule(
        name=rule_in.name,
        description=rule_in.description,
        trigger=rule_in.trigger,
        conditions=rule_in.conditions,
        actions=rule_in.actions,
        is_active=rule_in.is_active
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.get("/rules", response_model=List[RuleRead])
def list_automation_rules(
    current_user: Profile = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
    session: Session = Depends(get_session)
):
    rules = session.exec(select(AutomationRule)).all()
    return rules


@router.get("/logs", response_model=List[LogRead])
def list_automation_logs(
    current_user: Profile = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
    session: Session = Depends(get_session)
):
    """
    FR-14: Audit logs for automation rule executions.
    """
    logs = session.exec(select(AutomationLog).order_by(AutomationLog.executed_at.desc())).all()
    return logs

