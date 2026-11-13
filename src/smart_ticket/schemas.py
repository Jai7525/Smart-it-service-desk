from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid
from smart_ticket.models import (
    UserRole, TicketStatus, PriorityLevel, ImpactLevel, UrgencyLevel, IncidentCategory, ProblemStatus
)


# Auth / Profile
class ProfileBase(BaseModel):
    email: str
    full_name: str
    role: UserRole = UserRole.EMPLOYEE


class ProfileRead(ProfileBase):
    id: uuid.UUID
    is_active: bool
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Incidents
class IncidentCreate(BaseModel):
    subject: str
    description: str
    impact: ImpactLevel = ImpactLevel.MEDIUM
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    location: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: TicketStatus
    resolution_notes: Optional[str] = None
    reason: Optional[str] = None


class IncidentRead(BaseModel):
    id: uuid.UUID
    ticket_number: str
    subject: str
    description: str
    category: IncidentCategory
    subcategory: Optional[str]
    impact: ImpactLevel
    urgency: UrgencyLevel
    priority: PriorityLevel
    status: TicketStatus
    reporter_id: uuid.UUID
    assigned_team_id: Optional[uuid.UUID]
    assigned_agent_id: Optional[uuid.UUID]
    assigned_agent_name: Optional[str] = None
    assigned_team_name: Optional[str] = None
    location: Optional[str]
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime] = None
    resolved_by_id: Optional[uuid.UUID] = None
    closed_at: Optional[datetime] = None
    confirmed_by_id: Optional[uuid.UUID] = None
    reopen_reason: Optional[str] = None
    reopened_at: Optional[datetime] = None
    response_deadline: Optional[datetime]
    resolution_deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivityLogRead(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    actor_id: Optional[uuid.UUID]
    actor_name: Optional[str] = None
    event_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


# Comments
class CommentCreate(BaseModel):
    comment: str
    is_internal: bool = False


class CommentRead(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    author_id: uuid.UUID
    comment: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Problems
class ProblemCreate(BaseModel):
    title: str
    description: str
    category: IncidentCategory
    root_cause: Optional[str] = None
    workaround: Optional[str] = None
    permanent_solution: Optional[str] = None


class ProblemRead(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    category: IncidentCategory
    status: ProblemStatus
    root_cause: Optional[str]
    workaround: Optional[str]
    permanent_solution: Optional[str]
    created_by_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

