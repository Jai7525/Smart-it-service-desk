import pytest
import uuid
from sqlmodel import Session, select
from fastapi.testclient import TestClient
from smart_ticket.core.database import engine, init_db
from smart_ticket.models import (
    Incident, Profile, UserRole, TicketStatus, ImpactLevel, UrgencyLevel,
    PriorityLevel, IncidentCategory, Notification, ActivityLog
)
from smart_ticket.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def get_or_create_user(session: Session, email: str, full_name: str, role: UserRole) -> Profile:
    user = session.exec(select(Profile).where(Profile.email == email)).first()
    if not user:
        user = Profile(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            role=role,
            is_active=True,
            is_available=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user

def test_full_resolution_confirmation_lifecycle():
    """
    Step 1 -> Step 2 -> Step 3 -> Step 4:
    Employee creates -> Agent resolves -> Employee confirms -> System automatically closes.
    """
    with Session(engine) as session:
        emp = get_or_create_user(session, "employee.john@smartticket.local", "John Doe", UserRole.EMPLOYEE)
        agent = get_or_create_user(session, "agent.network@smartticket.local", "Alex Rivers", UserRole.AGENT)

        # 1. Create Incident as Employee
        create_res = client.post(
            "/api/incidents/",
            json={
                "subject": "VPN Gateway Timeout Test",
                "description": "Cannot connect to VPN from home office",
                "impact": "medium",
                "urgency": "medium",
                "location": "Remote"
            },
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert create_res.status_code == 201
        inc_data = create_res.json()
        inc_id = inc_data["id"]
        assert inc_data["status"] == "open"

        # Assign strictly to our agent for this test
        incident = session.get(Incident, uuid.UUID(inc_id))
        incident.assigned_agent_id = agent.id
        session.add(incident)
        session.commit()

        # 2. Agent moves to In Progress
        agent_ip_res = client.patch(
            f"/api/incidents/{inc_id}/status",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer dev-user:{agent.email}"}
        )
        assert agent_ip_res.status_code == 200
        assert agent_ip_res.json()["status"] == "in_progress"

        # 3. Agent attempts to DIRECTLY close ticket -> MUST BE FORBIDDEN (403)
        agent_close_res = client.patch(
            f"/api/incidents/{inc_id}/status",
            json={"status": "closed"},
            headers={"Authorization": f"Bearer dev-user:{agent.email}"}
        )
        assert agent_close_res.status_code == 403
        assert "Agents cannot close tickets directly" in agent_close_res.json()["detail"]

        # 4. Agent marks as Resolved with resolution note
        agent_resolve_res = client.patch(
            f"/api/incidents/{inc_id}/status",
            json={
                "status": "resolved",
                "resolution_notes": "Reconfigured IKEv2 gateway crypto profile and flushed stale route."
            },
            headers={"Authorization": f"Bearer dev-user:{agent.email}"}
        )
        assert agent_resolve_res.status_code == 200
        assert agent_resolve_res.json()["status"] == "resolved"
        assert agent_resolve_res.json()["resolution_notes"] is not None

        # Verify Employee received notification awaiting confirmation
        notifs = session.exec(
            select(Notification)
            .where(Notification.user_id == emp.id, Notification.related_incident_id == uuid.UUID(inc_id))
        ).all()
        assert len(notifs) >= 1
        assert "Resolved" in notifs[-1].title

        # 5. Unauthorized Employee tries to confirm -> MUST BE FORBIDDEN (403)
        other_emp = get_or_create_user(session, "other.emp@smartticket.local", "Other Employee", UserRole.EMPLOYEE)
        other_confirm_res = client.post(
            f"/api/incidents/{inc_id}/confirm-resolution",
            headers={"Authorization": f"Bearer dev-user:{other_emp.email}"}
        )
        assert other_confirm_res.status_code == 403
        assert "only confirm or reject resolution for your own incidents" in other_confirm_res.json()["detail"]

        # 6. Reporting Employee Confirms Resolution -> Ticket automatically CLOSED
        confirm_res = client.post(
            f"/api/incidents/{inc_id}/confirm-resolution",
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "closed"
        assert confirm_res.json()["confirmed_by_id"] == str(emp.id)

        # Verify activity log entries exist
        logs_res = client.get(
            f"/api/incidents/{inc_id}/activity-logs",
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert logs_res.status_code == 200
        event_types = [l["event_type"] for l in logs_res.json()]
        assert "resolved" in event_types
        assert "confirmed" in event_types


def test_rejection_and_reopen_workflow():
    """
    Step 5: Employee rejects resolution -> Reopened status -> Returned to Agent.
    """
    with Session(engine) as session:
        emp = get_or_create_user(session, "employee.john@smartticket.local", "John Doe", UserRole.EMPLOYEE)
        agent = get_or_create_user(session, "agent.network@smartticket.local", "Alex Rivers", UserRole.AGENT)

        # Create & setup resolved ticket
        ticket_num = f"INC-REOPEN-{uuid.uuid4().hex[:6].upper()}"
        incident = Incident(
            ticket_number=ticket_num,
            subject="Monitor flicker problem",
            description="External screen turns black randomly",
            category=IncidentCategory.HARDWARE,
            priority=PriorityLevel.MEDIUM,
            status=TicketStatus.RESOLVED,
            reporter_id=emp.id,
            assigned_agent_id=agent.id,
            resolution_notes="Replaced DisplayPort cable"
        )
        session.add(incident)
        session.commit()
        session.refresh(incident)

        # 1. Employee rejects resolution with reason
        reject_res = client.post(
            f"/api/incidents/{incident.id}/reject-resolution",
            json={"reason": "The monitor is still turning off when laptop is undocked."},
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert reject_res.status_code == 200
        assert reject_res.json()["status"] == "reopened"
        assert reject_res.json()["reopen_reason"] == "The monitor is still turning off when laptop is undocked."

        # Verify Agent received notification
        notifs = session.exec(
            select(Notification)
            .where(Notification.user_id == agent.id, Notification.related_incident_id == incident.id)
        ).all()
        assert len(notifs) >= 1
        assert "Reopened" in notifs[-1].title

        # 2. Agent resumes investigation and resolves again
        resume_res = client.patch(
            f"/api/incidents/{incident.id}/status",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer dev-user:{agent.email}"}
        )
        assert resume_res.status_code == 200
        assert resume_res.json()["status"] == "in_progress"

        resolve2_res = client.patch(
            f"/api/incidents/{incident.id}/status",
            json={"status": "resolved", "resolution_notes": "Updated Thunderbolt dock firmware and driver."},
            headers={"Authorization": f"Bearer dev-user:{agent.email}"}
        )
        assert resolve2_res.status_code == 200
        assert resolve2_res.json()["status"] == "resolved"

        # 3. Employee confirms 2nd resolution -> Closes ticket
        confirm_res = client.post(
            f"/api/incidents/{incident.id}/confirm-resolution",
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "closed"


def test_invalid_lifecycle_transition_guards():
    """
    Security & edge-case guards:
    - Cannot confirm an OPEN or IN_PROGRESS incident.
    - Cannot confirm a ticket that is already CLOSED.
    """
    with Session(engine) as session:
        emp = get_or_create_user(session, "employee.john@smartticket.local", "John Doe", UserRole.EMPLOYEE)

        ticket_num = f"INC-GUARD-{uuid.uuid4().hex[:6].upper()}"
        incident = Incident(
            ticket_number=ticket_num,
            subject="Printer toner low",
            description="Floor 3 printer warning",
            category=IncidentCategory.HARDWARE,
            priority=PriorityLevel.LOW,
            status=TicketStatus.OPEN,
            reporter_id=emp.id
        )
        session.add(incident)
        session.commit()
        session.refresh(incident)

        # Cannot confirm OPEN ticket
        bad_confirm = client.post(
            f"/api/incidents/{incident.id}/confirm-resolution",
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert bad_confirm.status_code == 400
        assert "Ticket must be 'resolved'" in bad_confirm.json()["detail"]
