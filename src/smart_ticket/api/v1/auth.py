from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import uuid

from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user
from smart_ticket.models import Profile, TeamMember, SupportTeam, Department
from smart_ticket.schemas import ProfileRead

router = APIRouter(prefix="/auth", tags=["Authentication & User Profile"])


class LoginRequest(BaseModel):
    email: str


@router.post("/login", response_model=Dict[str, Any])
def login_with_email(
    request: LoginRequest,
    session: Session = Depends(get_session)
):
    """
    Demonstration Email-Only Login:
    Searches PostgreSQL profiles table by exact email (case-insensitive).
    Returns real user profile, department, and team memberships.
    """
    cleaned_email = request.email.strip().lower()
    if not cleaned_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required."
        )

    user = session.exec(
        select(Profile).where(func.lower(Profile.email) == cleaned_email)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user account found with email '{request.email}'. Please check with an administrator."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your IT administrator."
        )

    # Resolve department name
    dept_name = "IT Operations"
    if user.department_id:
        dept = session.get(Department, user.department_id)
        if dept:
            dept_name = dept.name

    # Resolve team memberships if agent
    teams = session.exec(
        select(SupportTeam)
        .join(TeamMember, TeamMember.team_id == SupportTeam.id)
        .where(TeamMember.agent_id == user.id)
    ).all()

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "department_name": dept_name,
        "is_active": user.is_active,
        "is_available": user.is_available,
        "teams": [{"id": str(t.id), "name": t.name, "category": t.category.value if hasattr(t.category, "value") else str(t.category)} for t in teams]
    }


@router.get("/me", response_model=Dict[str, Any])
def get_current_user_profile(
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    SRS 7.1: Retrieve current logged-in user profile with team memberships.
    """
    dept_name = "IT Operations"
    if current_user.department_id:
        dept = session.get(Department, current_user.department_id)
        if dept:
            dept_name = dept.name

    teams = session.exec(
        select(SupportTeam)
        .join(TeamMember, TeamMember.team_id == SupportTeam.id)
        .where(TeamMember.agent_id == current_user.id)
    ).all()

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "department_name": dept_name,
        "is_active": current_user.is_active,
        "is_available": current_user.is_available,
        "teams": [{"id": str(t.id), "name": t.name, "category": t.category.value if hasattr(t.category, "value") else str(t.category)} for t in teams]
    }

