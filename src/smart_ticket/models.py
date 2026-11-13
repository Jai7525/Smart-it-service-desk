import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ==========================================
# Enumerations (Roles, Status, Priority, etc.)
# ==========================================

class UserRole(str, Enum):
    EMPLOYEE = "employee"
    AGENT = "agent"
    MANAGER = "manager"
    ADMIN = "admin"


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REOPENED = "reopened"


class PriorityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ImpactLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class UrgencyLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentCategory(str, Enum):
    NETWORK = "Network"
    HARDWARE = "Hardware"
    SOFTWARE = "Software"
    ACCESS = "Access"
    GENERAL = "General"


class ProblemStatus(str, Enum):
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    WORKAROUND_FOUND = "workaround_found"
    RESOLVED = "resolved"
    CLOSED = "closed"


class NotificationType(str, Enum):
    ASSIGNMENT = "assignment"
    STATUS_UPDATE = "status_update"
    SLA_WARNING = "sla_warning"
    SLA_BREACH = "sla_breach"
    MAJOR_ALERT = "major_alert"
    INFO = "info"


# ==========================================
# Relational Entities
# ==========================================

class Department(SQLModel, table=True):
    __tablename__ = "departments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)


class SupportTeam(SQLModel, table=True):
    __tablename__ = "support_teams"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    category: IncidentCategory = Field(index=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    role: UserRole = Field(default=UserRole.EMPLOYEE, index=True)
    department_id: Optional[uuid.UUID] = Field(default=None, foreign_key="departments.id")
    is_active: bool = Field(default=True)
    is_available: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)


class TeamMember(SQLModel, table=True):
    __tablename__ = "team_members"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    team_id: uuid.UUID = Field(foreign_key="support_teams.id", index=True)
    agent_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    created_at: datetime = Field(default_factory=get_utc_now)


class Incident(SQLModel, table=True):
    __tablename__ = "incidents"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ticket_number: str = Field(unique=True, index=True)  # e.g., INC-1001
    subject: str = Field(index=True)
    description: str
    
    # Classification & Priority
    category: IncidentCategory = Field(default=IncidentCategory.GENERAL, index=True)
    subcategory: Optional[str] = None
    impact: ImpactLevel = Field(default=ImpactLevel.MEDIUM)
    urgency: UrgencyLevel = Field(default=UrgencyLevel.MEDIUM)
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM, index=True)
    
    # Lifecycle Status
    status: TicketStatus = Field(default=TicketStatus.OPEN, index=True)
    
    # Ownership
    reporter_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    assigned_team_id: Optional[uuid.UUID] = Field(default=None, foreign_key="support_teams.id")
    assigned_agent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id", index=True)
    
    # Metadata & Context
    location: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id")
    confirmed_by_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id")
    reopen_reason: Optional[str] = None
    reopened_at: Optional[datetime] = None
    
    # SLA Tracking
    response_deadline: Optional[datetime] = None
    resolution_deadline: Optional[datetime] = None
    first_responded_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    sla_response_breached: bool = Field(default=False)
    sla_resolution_breached: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=get_utc_now, index=True)
    updated_at: datetime = Field(default_factory=get_utc_now)


class Assignment(SQLModel, table=True):
    __tablename__ = "assignments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incidents.id", index=True)
    team_id: Optional[uuid.UUID] = Field(default=None, foreign_key="support_teams.id")
    agent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id")
    assigned_by_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id")
    reason: Optional[str] = None
    assigned_at: datetime = Field(default_factory=get_utc_now)


class TicketComment(SQLModel, table=True):
    __tablename__ = "ticket_comments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incidents.id", index=True)
    author_id: uuid.UUID = Field(foreign_key="profiles.id")
    comment: str
    is_internal: bool = Field(default=False)
    created_at: datetime = Field(default_factory=get_utc_now)


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incidents.id", index=True)
    actor_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id")
    event_type: str = Field(index=True)  # resolved, confirmed, rejected, reopened, closed, assigned
    description: str
    created_at: datetime = Field(default_factory=get_utc_now, index=True)


class SLAPolicy(SQLModel, table=True):
    __tablename__ = "sla_policies"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    priority: PriorityLevel = Field(unique=True, index=True)
    response_time_hours: float
    resolution_time_hours: float
    warning_threshold_percentage: float = Field(default=0.75)  # 75% of deadline
    created_at: datetime = Field(default_factory=get_utc_now)


class Problem(SQLModel, table=True):
    __tablename__ = "problems"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(index=True)
    description: str
    category: IncidentCategory = Field(index=True)
    status: ProblemStatus = Field(default=ProblemStatus.INVESTIGATING, index=True)
    root_cause: Optional[str] = None
    workaround: Optional[str] = None
    permanent_solution: Optional[str] = None
    created_by_id: uuid.UUID = Field(foreign_key="profiles.id")
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class IncidentProblemLink(SQLModel, table=True):
    __tablename__ = "incident_problem_links"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incidents.id", index=True)
    problem_id: uuid.UUID = Field(foreign_key="problems.id", index=True)
    linked_at: datetime = Field(default_factory=get_utc_now)


class KnowledgeArticle(SQLModel, table=True):
    __tablename__ = "knowledge_articles"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(index=True)
    content: str
    category: IncidentCategory = Field(index=True)
    author_id: uuid.UUID = Field(foreign_key="profiles.id")
    is_published: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class AutomationRule(SQLModel, table=True):
    __tablename__ = "automation_rules"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True)
    description: Optional[str] = None
    trigger: str = Field(index=True)  # e.g., "ticket_created", "sla_warning", "similar_incidents_detected"
    conditions: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    actions: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)


class AutomationLog(SQLModel, table=True):
    __tablename__ = "automation_logs"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    rule_id: Optional[uuid.UUID] = Field(default=None, foreign_key="automation_rules.id")
    trigger: str
    incident_id: Optional[uuid.UUID] = Field(default=None, foreign_key="incidents.id")
    action_taken: str
    status: str  # "success", "failed"
    details: Optional[str] = None
    executed_at: datetime = Field(default_factory=get_utc_now)


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    title: str
    message: str
    type: NotificationType = Field(default=NotificationType.INFO)
    is_read: bool = Field(default=False)
    related_incident_id: Optional[uuid.UUID] = Field(default=None, foreign_key="incidents.id")
    created_at: datetime = Field(default_factory=get_utc_now)


class ServiceCatalogItem(SQLModel, table=True):
    __tablename__ = "service_catalog_items"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    category: str = Field(index=True)
    description: str
    icon: str = Field(default="Layers")
    estimated_delivery_hours: int = Field(default=24)
    requires_approval: bool = Field(default=True)
    required_fields: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_utc_now)


class ServiceRequest(SQLModel, table=True):
    __tablename__ = "service_requests"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_number: str = Field(unique=True, index=True)
    requester_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    catalog_item_id: Optional[uuid.UUID] = Field(default=None, foreign_key="service_catalog_items.id")
    title: str
    category: str
    business_justification: str
    required_date: Optional[datetime] = None
    additional_notes: Optional[str] = None
    form_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    status: str = Field(default="pending_approval", index=True)
    assigned_agent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id")
    assigned_team_id: Optional[uuid.UUID] = Field(default=None, foreign_key="support_teams.id")
    rejection_reason: Optional[str] = None
    more_info_notes: Optional[str] = None
    fulfillment_notes: Optional[str] = None
    fulfilled_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_utc_now, index=True)
    updated_at: datetime = Field(default_factory=get_utc_now)


class ServiceApproval(SQLModel, table=True):
    __tablename__ = "service_approvals"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_id: uuid.UUID = Field(foreign_key="service_requests.id", index=True)
    approver_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    decision: str = Field(default="pending")  # "pending", "approved", "rejected", "info_requested"
    comments: Optional[str] = None
    decision_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_utc_now)


class ChangeRequest(SQLModel, table=True):
    __tablename__ = "change_requests"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    change_number: str = Field(unique=True, index=True)
    title: str
    description: str
    change_type: str = Field(default="normal", index=True)  # "standard", "normal", "emergency"
    category: str = Field(index=True)
    reason: str
    affected_service: str
    affected_departments: Optional[str] = None
    business_impact: str = Field(default="medium")
    risk_level: str = Field(default="medium", index=True)  # "low", "medium", "high", "critical"
    risk_score: float = Field(default=2.50)
    status: str = Field(default="draft", index=True)  # "draft", "pending_cab", "approved", "scheduled", "in_progress", "completed", "failed", "rolled_back", "rejected"
    requester_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    assigned_owner_id: Optional[uuid.UUID] = Field(default=None, foreign_key="profiles.id")
    proposed_start: datetime = Field(index=True)
    proposed_end: datetime = Field(index=True)
    implementation_plan: str
    testing_plan: str
    rollback_plan: str
    expected_downtime_minutes: int = Field(default=0)
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    execution_notes: Optional[str] = None
    testing_results: Optional[str] = None
    rollback_status: Optional[str] = None
    review_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class ChangeApproval(SQLModel, table=True):
    __tablename__ = "change_approvals"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    change_id: uuid.UUID = Field(foreign_key="change_requests.id", index=True)
    approver_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    role_type: str = Field(default="cab")
    decision: str = Field(default="pending")  # "pending", "approved", "rejected"
    comments: Optional[str] = None
    decision_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=get_utc_now)


class AIConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="profiles.id", index=True)
    title: str = Field(default="New Conversation")
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)


class AIMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="ai_conversations.id", index=True)
    role: str = Field(index=True)  # "user", "assistant", "system"
    content: str
    meta_info: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=get_utc_now)

