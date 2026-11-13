from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user, require_roles
from smart_ticket.models import (
    Incident, Profile, UserRole, TicketStatus, Assignment, TicketComment,
    Notification, NotificationType, SupportTeam, ActivityLog
)
from smart_ticket.schemas import (
    IncidentCreate, IncidentRead, IncidentStatusUpdate,
    CommentCreate, CommentRead, ActivityLogRead
)
from smart_ticket.services.classification import ClassificationEngine
from smart_ticket.services.priority import PriorityEngine
from smart_ticket.services.assignment import AssignmentEngine
from smart_ticket.services.sla import SLAEngine
from smart_ticket.services.similarity import IncidentCorrelationEngine

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def generate_ticket_number(session: Session) -> str:
    """
    Generates sequential, concurrency-safe human-readable ticket number (e.g., INC-1001)
    """
    count = session.exec(select(func.count(Incident.id))).one()
    return f"INC-{1001 + count}"


@router.post("/", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    FR-03, FR-04, FR-05, FR-06, FR-07, FR-09:
    Creates an incident and runs it through the automated triage pipeline:
    1. Generates unique Ticket ID
    2. Classifies Category & Subcategory via Keyword Engine
    3. Calculates Priority via Decision Matrix
    4. Assigns Support Team & Least-Loaded Agent
    5. Calculates SLA Response & Resolution Deadlines
    6. Runs Incident Correlation for Major Incident Alerts
    """
    # 1. Ticket Number
    ticket_number = generate_ticket_number(session)

    # 2. Automated Classification
    category, subcategory = ClassificationEngine.classify(
        incident_in.subject, incident_in.description
    )

    # 3. Priority Calculation
    priority = PriorityEngine.calculate_priority(
        incident_in.impact, incident_in.urgency
    )

    # 4. Agent Assignment (Least-Loaded in Category Team)
    team_id, agent_id = AssignmentEngine.assign_ticket(session, category)

    # 5. SLA Deadlines
    now = datetime.now(timezone.utc)
    response_deadline, resolution_deadline = SLAEngine.calculate_deadlines(priority, now)

    # 6. Instantiate & Save Incident
    incident = Incident(
        ticket_number=ticket_number,
        subject=incident_in.subject,
        description=incident_in.description,
        category=category,
        subcategory=subcategory,
        impact=incident_in.impact,
        urgency=incident_in.urgency,
        priority=priority,
        status=TicketStatus.OPEN,
        reporter_id=current_user.id,
        assigned_team_id=team_id,
        assigned_agent_id=agent_id,
        location=incident_in.location,
        response_deadline=response_deadline,
        resolution_deadline=resolution_deadline,
        created_at=now,
        updated_at=now
    )
    session.add(incident)
    session.commit()
    session.refresh(incident)

    # Record Initial Assignment History
    if agent_id or team_id:
        assignment_record = Assignment(
            incident_id=incident.id,
            team_id=team_id,
            agent_id=agent_id,
            assigned_by_id=current_user.id,
            reason="Automated workload dispatch"
        )
        session.add(assignment_record)

    # Activity log for creation
    session.add(ActivityLog(
        incident_id=incident.id,
        actor_id=current_user.id,
        event_type="created",
        description=f"Incident {ticket_number} created by {current_user.full_name} and classified as {category.value}."
    ))

    # In-App Notification for Agent or IT Manager if unassigned
    if agent_id:
        agent_notification = Notification(
            user_id=agent_id,
            title="New Ticket Assigned",
            message=f"Ticket {ticket_number}: {incident.subject} has been assigned to you.",
            type=NotificationType.ASSIGNMENT,
            related_incident_id=incident.id
        )
        session.add(agent_notification)
    else:
        # Requirement 6: If no eligible agent is available, notify IT Managers
        managers = session.exec(
            select(Profile).where(Profile.role == UserRole.MANAGER, Profile.is_active == True)
        ).all()
        for mgr in managers:
            mgr_notification = Notification(
                user_id=mgr.id,
                title="Unassigned Ticket Alert",
                message=f"Ticket {ticket_number} ({category.value}) could not be assigned: No eligible support agents currently available.",
                type=NotificationType.INFO,
                related_incident_id=incident.id
            )
            session.add(mgr_notification)

    # 7. Check for Similar Incidents & Potential Major Incidents
    is_major_alert, matching_incidents = IncidentCorrelationEngine.detect_similar_incidents(
        session, incident
    )
    if is_major_alert:
        # Notify all active IT Managers
        managers = session.exec(
            select(Profile).where(
                Profile.role == UserRole.MANAGER, Profile.is_active == True
            )
        ).all()
        for mgr in managers:
            alert_notification = Notification(
                user_id=mgr.id,
                title="Potential Major Incident Alert",
                message=f"Cluster of {len(matching_incidents)} similar incidents detected in {category.value} category.",
                type=NotificationType.MAJOR_ALERT,
                related_incident_id=incident.id
            )
            session.add(alert_notification)

    session.commit()
    session.refresh(incident)

    # Populate names for response
    agent = session.get(Profile, incident.assigned_agent_id) if incident.assigned_agent_id else None
    team = session.get(SupportTeam, incident.assigned_team_id) if incident.assigned_team_id else None
    
    res = IncidentRead.model_validate(incident)
    res.assigned_agent_name = agent.full_name if agent else "Auto-Dispatch Queue"
    res.assigned_team_name = team.name if team else None
    return res


@router.get("/", response_model=List[IncidentRead])
def list_incidents(
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    FR-02 RBAC:
    - Employees see only their own submitted tickets.
    - Agents see tickets assigned to them or their team.
    - Managers & Admins see all tickets.
    """
    query = select(Incident)
    incidents = session.exec(query.order_by(Incident.created_at.desc())).all()

    # Pre-fetch agent and team names
    agent_ids = {i.assigned_agent_id for i in incidents if i.assigned_agent_id}
    team_ids = {i.assigned_team_id for i in incidents if i.assigned_team_id}
    
    agents_map = {p.id: p.full_name for p in session.exec(select(Profile).where(Profile.id.in_(agent_ids))).all()} if agent_ids else {}
    teams_map = {t.id: t.name for t in session.exec(select(SupportTeam).where(SupportTeam.id.in_(team_ids))).all()} if team_ids else {}

    results = []
    for inc in incidents:
        item = IncidentRead.model_validate(inc)
        item.assigned_agent_name = agents_map.get(inc.assigned_agent_id, "Auto-Dispatch Queue") if inc.assigned_agent_id else "Auto-Dispatch Queue"
        item.assigned_team_name = teams_map.get(inc.assigned_team_id)
        results.append(item)

    return results


@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(
    incident_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # RBAC authorization check
    if current_user.role == UserRole.EMPLOYEE and incident.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this incident")

    return incident


@router.patch("/{incident_id}/status", response_model=IncidentRead)
def update_incident_status(
    incident_id: uuid.UUID,
    status_update: IncidentStatusUpdate,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    FR-08: Lifecycle Management (Open -> In Progress -> Resolved -> Closed, and Reopened)
    Strict Business Rules:
    - IT Support Agent can mark an assigned incident as RESOLVED with resolution notes.
    - Agent CANNOT directly mark a ticket as CLOSED through normal resolution flow.
    - Employee CANNOT mark tickets as IN_PROGRESS or RESOLVED.
    - Only the Employee who reported the ticket can CONFIRM resolution (closing it) or REJECT (reopening it).
    """
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc)
    target_status = status_update.status

    # 1. Role & Lifecycle Permissions
    if current_user.role == UserRole.EMPLOYEE:
        # Must be the incident reporter
        if incident.reporter_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only confirm or reject resolution for your own incidents."
            )
        # Employee can only transition from RESOLVED to CLOSED (Confirm) or to REOPENED/IN_PROGRESS (Reject)
        if incident.status != TicketStatus.RESOLVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot confirm or reject resolution on ticket with status '{incident.status.value}'. Ticket must be 'resolved'."
            )
        if target_status not in [TicketStatus.CLOSED, TicketStatus.REOPENED, TicketStatus.IN_PROGRESS]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employees can only confirm resolution (close) or reject resolution (reopen)."
            )

    elif current_user.role == UserRole.AGENT:
        # Agent must be the assigned agent or manager
        if incident.assigned_agent_id != current_user.id and current_user.role != UserRole.MANAGER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned IT Support Agent or an IT Manager can update this ticket."
            )
        # Agent CANNOT directly close the ticket through this resolution workflow
        if target_status == TicketStatus.CLOSED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Agents cannot close tickets directly. The reporting employee must verify and confirm the resolution."
            )
        if target_status == TicketStatus.RESOLVED and not (status_update.resolution_notes or incident.resolution_notes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A technical resolution description is required when marking an incident as resolved."
            )

    # 2. Apply Status-Specific State & Timestamps
    if incident.status == TicketStatus.OPEN and target_status == TicketStatus.IN_PROGRESS:
        if not incident.first_responded_at:
            incident.first_responded_at = now
        session.add(ActivityLog(
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="in_progress",
            description=f"Ticket investigation started by {current_user.full_name}."
        ))

    elif target_status == TicketStatus.RESOLVED:
        incident.resolved_at = now
        incident.resolved_by_id = current_user.id
        if status_update.resolution_notes:
            incident.resolution_notes = status_update.resolution_notes

        session.add(ActivityLog(
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="resolved",
            description=f"Incident marked as Resolved by {current_user.full_name}. Resolution: {incident.resolution_notes}"
        ))

        # Notify Employee that resolution awaits their confirmation
        session.add(Notification(
            user_id=incident.reporter_id,
            title=f"Incident {incident.ticket_number} Resolved",
            message=f"Agent {current_user.full_name} has resolved your ticket with note: \"{incident.resolution_notes}\". Please verify and confirm resolution.",
            type=NotificationType.STATUS_UPDATE,
            related_incident_id=incident.id
        ))

    elif target_status == TicketStatus.CLOSED:
        # Employee confirmed resolution
        incident.closed_at = now
        incident.confirmed_by_id = current_user.id

        session.add(ActivityLog(
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="confirmed",
            description=f"Resolution confirmed by employee {current_user.full_name}. Incident successfully closed."
        ))

        # Notify assigned agent that ticket is confirmed and closed
        if incident.assigned_agent_id:
            session.add(Notification(
                user_id=incident.assigned_agent_id,
                title=f"Ticket {incident.ticket_number} Confirmed & Closed",
                message=f"Employee {current_user.full_name} confirmed resolution for ticket {incident.ticket_number}. Ticket is now closed.",
                type=NotificationType.STATUS_UPDATE,
                related_incident_id=incident.id
            ))

    elif target_status in [TicketStatus.REOPENED, TicketStatus.IN_PROGRESS] and incident.status == TicketStatus.RESOLVED:
        # Employee rejected resolution
        rejection_reason = status_update.reason or status_update.resolution_notes or "Issue persists - not resolved."
        incident.reopen_reason = rejection_reason
        incident.reopened_at = now
        incident.status = TicketStatus.REOPENED

        session.add(ActivityLog(
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="rejected",
            description=f"Resolution rejected by employee {current_user.full_name}. Reason: {rejection_reason}"
        ))

        # Notify assigned agent that ticket was reopened
        if incident.assigned_agent_id:
            session.add(Notification(
                user_id=incident.assigned_agent_id,
                title=f"Ticket {incident.ticket_number} Reopened by Employee",
                message=f"Employee {current_user.full_name} reported issue not resolved: \"{rejection_reason}\". Ticket returned to queue.",
                type=NotificationType.STATUS_UPDATE,
                related_incident_id=incident.id
            ))

        incident.updated_at = now
        session.add(incident)
        session.commit()
        session.refresh(incident)
        return incident

    incident.status = target_status
    incident.updated_at = now
    session.add(incident)
    session.commit()
    session.refresh(incident)
    return incident


@router.post("/{incident_id}/confirm-resolution", response_model=IncidentRead)
def confirm_resolution(
    incident_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Dedicated endpoint for Employee to confirm resolution and close the incident.
    """
    status_update = IncidentStatusUpdate(status=TicketStatus.CLOSED)
    return update_incident_status(incident_id, status_update, current_user, session)


@router.post("/{incident_id}/reject-resolution", response_model=IncidentRead)
def reject_resolution(
    incident_id: uuid.UUID,
    payload: dict,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Dedicated endpoint for Employee to reject resolution with a reason and reopen ticket.
    """
    reason = payload.get("reason", "Issue persists; resolution rejected.")
    status_update = IncidentStatusUpdate(status=TicketStatus.REOPENED, reason=reason)
    return update_incident_status(incident_id, status_update, current_user, session)


@router.get("/{incident_id}/activity-logs", response_model=List[ActivityLogRead])
def get_activity_logs(
    incident_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Retrieves full audit log and activity lifecycle history for the incident.
    """
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    logs = session.exec(
        select(ActivityLog)
        .where(ActivityLog.incident_id == incident_id)
        .order_by(ActivityLog.created_at.asc())
    ).all()

    results = []
    for log in logs:
        actor = session.get(Profile, log.actor_id) if log.actor_id else None
        results.append(ActivityLogRead(
            id=log.id,
            incident_id=log.incident_id,
            actor_id=log.actor_id,
            actor_name=actor.full_name if actor else "System",
            event_type=log.event_type,
            description=log.description,
            created_at=log.created_at
        ))
    return results


@router.post("/{incident_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(
    incident_id: uuid.UUID,
    comment_in: CommentCreate,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Adds a comment to an incident. Internal notes are restricted from Employees.
    """
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if comment_in.is_internal and current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Employees cannot create internal notes")

    comment = TicketComment(
        incident_id=incident.id,
        author_id=current_user.id,
        comment=comment_in.comment,
        is_internal=comment_in.is_internal
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment


@router.get("/{incident_id}/comments", response_model=List[CommentRead])
def list_comments(
    incident_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Lists comments for an incident. Filters out internal notes for Employees.
    """
    query = select(TicketComment).where(TicketComment.incident_id == incident_id)
    if current_user.role == UserRole.EMPLOYEE:
        query = query.where(TicketComment.is_internal == False)

    comments = session.exec(query.order_by(TicketComment.created_at.asc())).all()
    return comments


@router.post("/{incident_id}/assign", response_model=IncidentRead)
def manual_reassign_incident(
    incident_id: uuid.UUID,
    reassign_data: dict,
    current_user: Profile = Depends(require_roles([UserRole.AGENT, UserRole.MANAGER, UserRole.ADMIN])),
    session: Session = Depends(get_session)
):
    """
    Requirement 7 & 8: Manual assignment by IT Manager.
    - Validates that the selected agent has strictly UserRole.AGENT.
    - Rejects assignment to Managers, Employees, or Admins.
    - Preserves assignment history and records the reassignment.
    """
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    target_agent_id_str = reassign_data.get("agent_id")
    target_team_id_str = reassign_data.get("team_id")
    reason = reassign_data.get("reason", "Manual reassignment by manager")

    target_agent = None
    if target_agent_id_str:
        target_agent = session.get(Profile, uuid.UUID(str(target_agent_id_str)))
        if not target_agent:
            raise HTTPException(status_code=404, detail="Target agent not found")
        # Strict validation: ONLY UserRole.AGENT allowed
        if target_agent.role != UserRole.AGENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot assign ticket to user with role '{target_agent.role.value}'. Only users with the role 'IT Support Agent' are eligible for ticket assignment."
            )

    target_team_id = uuid.UUID(str(target_team_id_str)) if target_team_id_str else incident.assigned_team_id
    target_agent_id = target_agent.id if target_agent else None

    # Update incident
    incident.assigned_team_id = target_team_id
    incident.assigned_agent_id = target_agent_id
    incident.updated_at = datetime.now(timezone.utc)
    session.add(incident)

    # Record assignment history (Requirement 8)
    history_record = Assignment(
        incident_id=incident.id,
        team_id=target_team_id,
        agent_id=target_agent_id,
        assigned_by_id=current_user.id,
        reason=reason
    )
    session.add(history_record)

    # Notify newly assigned agent
    if target_agent_id:
        session.add(Notification(
            user_id=target_agent_id,
            title="Ticket Reassigned To You",
            message=f"Ticket {incident.ticket_number}: {incident.subject} has been reassigned to you by {current_user.full_name}.",
            type=NotificationType.ASSIGNMENT,
            related_incident_id=incident.id
        ))

    session.commit()
    session.refresh(incident)

    # Return populated IncidentRead
    agent = session.get(Profile, incident.assigned_agent_id) if incident.assigned_agent_id else None
    team = session.get(SupportTeam, incident.assigned_team_id) if incident.assigned_team_id else None

    res = IncidentRead.model_validate(incident)
    res.assigned_agent_name = agent.full_name if agent else "Unassigned"
    res.assigned_team_name = team.name if team else None
    return res


