from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Dict, Any, List

from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user
from smart_ticket.models import Profile, TeamMember, SupportTeam
from smart_ticket.schemas import ProfileRead

router = APIRouter(prefix="/auth", tags=["Authentication & User Profile"])


@router.get("/me", response_model=Dict[str, Any])
def get_current_user_profile(
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    SRS 7.1: Retrieve current logged-in user profile with team memberships.
    """
    teams = session.exec(
        select(SupportTeam)
        .join(TeamMember, TeamMember.team_id == SupportTeam.id)
        .where(TeamMember.agent_id == current_user.id)
    ).all()

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_available": current_user.is_available,
        "teams": [{"id": t.id, "name": t.name, "category": t.category} for t in teams]
    }

