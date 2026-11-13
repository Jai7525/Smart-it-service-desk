from datetime import datetime, timezone
from sqlmodel import Session, select
from smart_ticket.core.database import engine
from smart_ticket.models import Incident, TicketStatus, Notification, NotificationType, Profile, UserRole


def check_and_escalate_slas():
    """
    SRS FR-09 & Section 8.3: SLA Escalation & Monitoring Process.
    Iterates through all active tickets (OPEN or IN_PROGRESS):
    1. Checks if Response Deadline passed -> marks breached, notifies manager.
    2. Checks if Resolution Deadline passed -> marks breached, notifies manager.
    3. Checks approaching deadlines (warning threshold).
    """
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        active_incidents = session.exec(
            select(Incident).where(
                Incident.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
            )
        ).all()

        managers = session.exec(
            select(Profile).where(Profile.role == UserRole.MANAGER, Profile.is_active == True)
        ).all()

        for inc in active_incidents:
            # 1. Response SLA Check
            if inc.response_deadline and not inc.first_responded_at:
                if now > inc.response_deadline and not inc.sla_response_breached:
                    inc.sla_response_breached = True
                    session.add(inc)

                    # Escalate to Assigned Agent & Managers
                    if inc.assigned_agent_id:
                        session.add(Notification(
                            user_id=inc.assigned_agent_id,
                            title=f"SLA BREACH: Response Target Missed ({inc.ticket_number})",
                            message=f"Incident {inc.ticket_number} has missed its first response deadline.",
                            type=NotificationType.SLA_BREACH,
                            related_incident_id=inc.id
                        ))

                    for mgr in managers:
                        session.add(Notification(
                            user_id=mgr.id,
                            title=f"SLA Escalation: {inc.ticket_number}",
                            message=f"Response deadline breached for {inc.priority.value} incident {inc.ticket_number}.",
                            type=NotificationType.SLA_BREACH,
                            related_incident_id=inc.id
                        ))

            # 2. Resolution SLA Check
            if inc.resolution_deadline and not inc.resolved_at:
                if now > inc.resolution_deadline and not inc.sla_resolution_breached:
                    inc.sla_resolution_breached = True
                    session.add(inc)

                    for mgr in managers:
                        session.add(Notification(
                            user_id=mgr.id,
                            title=f"SLA BREACH: Resolution Target Missed ({inc.ticket_number})",
                            message=f"Incident {inc.ticket_number} exceeded its resolution target of {inc.priority.value} priority.",
                            type=NotificationType.SLA_BREACH,
                            related_incident_id=inc.id
                        ))

        session.commit()

