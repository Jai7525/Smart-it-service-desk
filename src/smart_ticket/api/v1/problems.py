from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
import uuid

from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user, require_roles
from smart_ticket.models import Problem, IncidentProblemLink, Incident, Profile, UserRole
from smart_ticket.schemas import ProblemCreate, ProblemRead

router = APIRouter(prefix="/problems", tags=["Problem Management"])


@router.post("/", response_model=ProblemRead, status_code=status.HTTP_201_CREATED)
def create_problem(
    problem_in: ProblemCreate,
    current_user: Profile = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
    session: Session = Depends(get_session)
):
    """
    FR-12: IT Managers can create problem records to track root-cause investigations.
    """
    problem = Problem(
        title=problem_in.title,
        description=problem_in.description,
        category=problem_in.category,
        root_cause=problem_in.root_cause,
        workaround=problem_in.workaround,
        permanent_solution=problem_in.permanent_solution,
        created_by_id=current_user.id
    )
    session.add(problem)
    session.commit()
    session.refresh(problem)
    return problem


@router.get("/", response_model=List[ProblemRead])
def list_problems(
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Retrieves all problem records.
    """
    problems = session.exec(select(Problem).order_by(Problem.created_at.desc())).all()
    return problems


@router.post("/{problem_id}/incidents/{incident_id}", status_code=status.HTTP_200_OK)
def link_incident_to_problem(
    problem_id: uuid.UUID,
    incident_id: uuid.UUID,
    current_user: Profile = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
    session: Session = Depends(get_session)
):
    """
    FR-12: Links an incident to a problem record.
    """
    problem = session.get(Problem, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Check for existing link
    existing = session.exec(
        select(IncidentProblemLink).where(
            IncidentProblemLink.problem_id == problem_id,
            IncidentProblemLink.incident_id == incident_id
        )
    ).first()

    if not existing:
        link = IncidentProblemLink(problem_id=problem_id, incident_id=incident_id)
        session.add(link)
        session.commit()

    return {"status": "success", "message": f"Incident {incident.ticket_number} linked to problem {problem.title}"}

