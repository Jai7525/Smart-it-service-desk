from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from typing import Dict, Any

from smart_ticket.core.database import get_session
from smart_ticket.core.security import require_roles
from smart_ticket.models import Incident, Problem, Profile, UserRole, TicketStatus, PriorityLevel

router = APIRouter(prefix="/analytics", tags=["Dashboard & Analytics"])


@router.get("/overview", response_model=Dict[str, Any])
def get_manager_overview(
    current_user: Profile = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
    session: Session = Depends(get_session)
):
    """
    FR-15: IT Manager Overview Statistics
    - Total, open, in-progress, resolved, closed incidents
    - Breached tickets count
    - Priority distribution
    - Active problems
    """
    total = session.exec(select(func.count(Incident.id))).one()
    open_count = session.exec(select(func.count(Incident.id)).where(Incident.status == TicketStatus.OPEN)).one()
    in_progress_count = session.exec(select(func.count(Incident.id)).where(Incident.status == TicketStatus.IN_PROGRESS)).one()
    resolved_count = session.exec(select(func.count(Incident.id)).where(Incident.status == TicketStatus.RESOLVED)).one()
    closed_count = session.exec(select(func.count(Incident.id)).where(Incident.status == TicketStatus.CLOSED)).one()
    reopened_count = session.exec(select(func.count(Incident.id)).where(Incident.status == TicketStatus.REOPENED)).one()

    critical_count = session.exec(select(func.count(Incident.id)).where(Incident.priority == PriorityLevel.CRITICAL)).one()
    high_count = session.exec(select(func.count(Incident.id)).where(Incident.priority == PriorityLevel.HIGH)).one()

    sla_breaches = session.exec(
        select(func.count(Incident.id)).where(
            (Incident.sla_response_breached == True) | (Incident.sla_resolution_breached == True)
        )
    ).one()

    active_problems = session.exec(select(func.count(Problem.id))).one()
    unassigned_count = session.exec(
        select(func.count(Incident.id)).where(Incident.assigned_agent_id == None, Incident.status != TicketStatus.CLOSED)
    ).one()

    # Team workload statistics
    from smart_ticket.models import SupportTeam, TeamMember
    teams = session.exec(select(SupportTeam)).all()
    team_stats = []
    for t in teams:
        active_in_team = session.exec(
            select(func.count(Incident.id)).where(
                Incident.assigned_team_id == t.id,
                Incident.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.REOPENED])
            )
        ).one()
        member_count = session.exec(
            select(func.count(TeamMember.id)).where(TeamMember.team_id == t.id)
        ).one()
        team_stats.append({
            "id": str(t.id),
            "name": t.name,
            "category": t.category.value,
            "active_tickets": active_in_team,
            "member_count": member_count,
        })

    return {
        "incidents": {
            "total": total,
            "open": open_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count,
            "awaiting_confirmation": resolved_count,
            "closed": closed_count,
            "reopened": reopened_count,
            "unassigned": unassigned_count,
        },
        "priorities": {
            "critical": critical_count,
            "high": high_count,
        },
        "sla_breaches": sla_breaches,
        "active_problems": active_problems,
        "team_workloads": team_stats
    }

