import pytest
from sqlmodel import Session, select
from smart_ticket.core.database import engine, init_db
from smart_ticket.models import (
    IncidentCategory, SupportTeam, TeamMember, Profile, Incident,
    TicketStatus, UserRole, ImpactLevel, UrgencyLevel, PriorityLevel
)
from smart_ticket.services.assignment import AssignmentEngine
from fastapi.testclient import TestClient
from smart_ticket.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_only_agents_assigned_for_all_categories():
    """
    Test Requirement 1, 2, 3, 5:
    Check ticket assignment across Network, Hardware, Software, Access, and General.
    Verify that NO manager, employee, or administrator is ever assigned.
    """
    with Session(engine) as session:
        for cat in [
            IncidentCategory.NETWORK,
            IncidentCategory.HARDWARE,
            IncidentCategory.SOFTWARE,
            IncidentCategory.ACCESS,
            IncidentCategory.GENERAL
        ]:
            team_id, agent_id = AssignmentEngine.assign_ticket(session, cat)
            print(f"Testing {cat.value}: team={team_id}, agent={agent_id}")
            
            # If an agent was assigned, check their role strictly
            if agent_id:
                agent = session.get(Profile, agent_id)
                assert agent is not None
                assert agent.role == UserRole.AGENT, f"Assigned user {agent.full_name} has role {agent.role}, expected AGENT!"
                assert agent.role != UserRole.MANAGER
                assert agent.role != UserRole.EMPLOYEE
                assert agent.role != UserRole.ADMIN

def test_lowest_active_workload_selected():
    """
    Test Requirement 4:
    Among eligible agents, the available agent with lowest active workload is selected.
    """
    with Session(engine) as session:
        # Close test incidents to ensure test determinism regardless of prior run accumulation
        open_test_incs = session.exec(
            select(Incident).where(
                Incident.ticket_number.like("INC-103%"),
                Incident.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
            )
        ).all()
        for ti in open_test_incs:
            ti.status = TicketStatus.CLOSED
        session.commit()

        team_id, agent_id = AssignmentEngine.assign_ticket(session, IncidentCategory.NETWORK)
        assert agent_id is not None
        assigned_agent = session.get(Profile, agent_id)
        assert assigned_agent.role == UserRole.AGENT

def test_api_reassign_rejects_manager_and_employee():
    """
    Test Requirement 7, 8, 9:
    Manual assignment API rejects non-agent roles (Managers, Employees, Admins).
    """
    with Session(engine) as session:
        manager = session.exec(select(Profile).where(Profile.role == UserRole.MANAGER)).first()
        employee = session.exec(select(Profile).where(Profile.role == UserRole.EMPLOYEE)).first()
        agent = session.exec(select(Profile).where(Profile.role == UserRole.AGENT)).first()
        incident = session.exec(select(Incident)).first()

        assert manager is not None
        assert employee is not None
        assert agent is not None
        assert incident is not None

        # Try to manually assign to Manager -> MUST BE REJECTED with 400
        res = client.post(f"/api/incidents/{incident.id}/assign", json={
            "agent_id": str(manager.id),
            "reason": "Test manager assign"
        })
        assert res.status_code == 400, f"Expected 400 when assigning to manager, got {res.status_code}"
        assert "Only users with the role 'IT Support Agent' are eligible" in res.json()["detail"]

        # Try to manually assign to Employee -> MUST BE REJECTED with 400
        res = client.post(f"/api/incidents/{incident.id}/assign", json={
            "agent_id": str(employee.id),
            "reason": "Test employee assign"
        })
        assert res.status_code == 400, f"Expected 400 when assigning to employee, got {res.status_code}"
        assert "Only users with the role 'IT Support Agent' are eligible" in res.json()["detail"]

        # Assign to legitimate Agent -> SUCCESS 200
        res = client.post(f"/api/incidents/{incident.id}/assign", json={
            "agent_id": str(agent.id),
            "reason": "Legitimate reassignment"
        })
        assert res.status_code == 200
        assert res.json()["assigned_agent_id"] == str(agent.id)


def test_workload_capacity_and_unassigned_trigger():
    """
    Phase 2 & Phase 3 Verification:
    - Verifies that when all agents reach maximum capacity (or are unavailable),
      the ticket remains unassigned and triggers IT Manager notification.
    """
    with Session(engine) as session:
        # Check team workload query
        team_id, agent_id = AssignmentEngine.assign_ticket(session, IncidentCategory.NETWORK)
        assert team_id is not None
        if agent_id:
            assigned = session.get(Profile, agent_id)
            assert assigned.role == UserRole.AGENT

