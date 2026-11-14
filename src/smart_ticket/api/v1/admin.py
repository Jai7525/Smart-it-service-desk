from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
import uuid
from pydantic import BaseModel
from smart_ticket.core.database import get_session
from smart_ticket.core.security import require_roles, get_current_user
from smart_ticket.models import Profile, SupportTeam, SLAPolicy, UserRole, IncidentCategory, PriorityLevel, Department
from smart_ticket.schemas import ProfileRead

router = APIRouter(prefix="/admin", tags=["System Administration"])


class UserCreateSchema(BaseModel):
    full_name: str
    email: str
    role: UserRole
    department_name: Optional[str] = "Engineering"


class TeamCreateSchema(BaseModel):
    name: str
    category: IncidentCategory
    description: Optional[str] = None


class SlaUpdateSchema(BaseModel):
    priority: PriorityLevel
    response_time_hours: float
    resolution_time_hours: float


@router.get("/users", response_model=List[ProfileRead])
def list_all_users(session: Session = Depends(get_session)):
    users = session.exec(select(Profile).order_by(Profile.created_at.desc())).all()
    # Enrich with department_name if available
    dept_map = {d.id: d.name for d in session.exec(select(Department)).all()}
    results = []
    for u in users:
        p = ProfileRead.model_validate(u)
        if u.department_id and u.department_id in dept_map:
            p.department_name = dept_map[u.department_id]
        results.append(p)
    return results


@router.post("/users", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
def create_user_account(user_in: UserCreateSchema, session: Session = Depends(get_session)):
    clean_email = user_in.email.strip().lower()
    existing = session.exec(select(Profile).where(Profile.email.ilike(clean_email))).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    dept_id = None
    if user_in.department_name:
        dept = session.exec(
            select(Department).where(Department.name.ilike(user_in.department_name.strip()))
        ).first()
        if not dept:
            dept = Department(name=user_in.department_name.strip())
            session.add(dept)
            session.commit()
            session.refresh(dept)
        dept_id = dept.id

    new_user = Profile(
        email=clean_email,
        full_name=user_in.full_name.strip(),
        role=user_in.role,
        department_id=dept_id,
        is_active=True,
        is_available=True
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    p = ProfileRead.model_validate(new_user)
    if dept_id and user_in.department_name:
        p.department_name = user_in.department_name.strip()
    return p


@router.patch("/users/{user_id}/toggle-active", response_model=ProfileRead)
def toggle_user_active(user_id: uuid.UUID, session: Session = Depends(get_session)):
    user = session.get(Profile, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/teams")
def list_teams(session: Session = Depends(get_session)):
    teams = session.exec(select(SupportTeam)).all()
    results = []
    from smart_ticket.models import TeamMember, Incident, TicketStatus
    from sqlmodel import func

    for t in teams:
        agents_count = session.exec(
            select(func.count(TeamMember.agent_id)).where(TeamMember.team_id == t.id)
        ).one()
        active_workload = session.exec(
            select(func.count(Incident.id)).where(
                Incident.assigned_team_id == t.id,
                Incident.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.REOPENED])
            )
        ).one()
        results.append({
            "id": str(t.id),
            "name": t.name,
            "category": t.category,
            "description": t.description,
            "created_at": t.created_at,
            "agents_count": agents_count,
            "active_workload": active_workload,
        })
    return results


@router.post("/teams", status_code=status.HTTP_201_CREATED)
def create_team(team_in: TeamCreateSchema, session: Session = Depends(get_session)):
    team = SupportTeam(
        name=team_in.name,
        category=team_in.category,
        description=team_in.description
    )
    session.add(team)
    session.commit()
    session.refresh(team)
    return team


@router.get("/sla-policies")
def list_sla_policies(session: Session = Depends(get_session)):
    return session.exec(select(SLAPolicy)).all()


@router.put("/sla-policies")
def update_sla_policy(policy_in: SlaUpdateSchema, session: Session = Depends(get_session)):
    policy = session.exec(select(SLAPolicy).where(SLAPolicy.priority == policy_in.priority)).first()
    if not policy:
        policy = SLAPolicy(
            priority=policy_in.priority,
            response_time_hours=policy_in.response_time_hours,
            resolution_time_hours=policy_in.resolution_time_hours
        )
    else:
        policy.response_time_hours = policy_in.response_time_hours
        policy.resolution_time_hours = policy_in.resolution_time_hours
    session.add(policy)
    session.commit()
    session.refresh(policy)
    return policy

