import pytest
import uuid
from sqlmodel import Session, select
from fastapi.testclient import TestClient
from smart_ticket.core.database import engine, init_db
from smart_ticket.models import (
    Profile, UserRole, ServiceCatalogItem, ServiceRequest, ServiceApproval,
    ChangeRequest, ChangeApproval, AIConversation, AIMessage
)
from smart_ticket.main import app

client = TestClient(app)

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

def test_service_request_lifecycle():
    """
    Test Module 1: Service Catalog & Requests
    Employee submits request -> Manager approves -> Status changes to approved.
    """
    with Session(engine) as session:
        emp = get_or_create_user(session, "employee.sr@smartticket.local", "SR Employee", UserRole.EMPLOYEE)
        mgr = get_or_create_user(session, "manager.sr@smartticket.local", "SR Manager", UserRole.MANAGER)

        catalog_item = session.exec(select(ServiceCatalogItem)).first()
        assert catalog_item is not None

        # 1. Employee creates request
        res = client.post(
            "/api/service-requests/",
            json={
                "catalog_item_id": str(catalog_item.id),
                "title": catalog_item.name,
                "category": catalog_item.category,
                "business_justification": "Required for upcoming security testing project",
                "form_data": {"software_name": "Docker Desktop", "os_type": "Windows 11"}
            },
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert res.status_code == 201
        data = res.json()
        req_id = data["id"]
        assert data["status"] == "pending_approval"

        # 2. Manager approves
        appr_res = client.post(
            f"/api/service-requests/{req_id}/approve",
            json={"decision": "approved", "comments": "Approved for project work."},
            headers={"Authorization": f"Bearer dev-user:{mgr.email}"}
        )
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "approved"

def test_change_management_lifecycle():
    """
    Test Module 2: Change Management
    Agent creates change -> Risk calculated by backend -> Manager approves.
    """
    with Session(engine) as session:
        agent = get_or_create_user(session, "agent.cm@smartticket.local", "CM Agent", UserRole.AGENT)
        mgr = get_or_create_user(session, "manager.cm@smartticket.local", "CM Manager", UserRole.MANAGER)

        # 1. Create Change Request with Risk Assessment
        res = client.post(
            "/api/changes/",
            json={
                "title": "Upgrade Core Switch Firmware",
                "description": "Routine security vulnerability patch upgrade",
                "change_type": "normal",
                "category": "Network",
                "reason": "Address CVE-2026-9901 advisory",
                "affected_service": "Core Routing Gateway",
                "proposed_start": "2026-11-20T02:00:00Z",
                "proposed_end": "2026-11-20T04:00:00Z",
                "implementation_plan": "1. Flash image\n2. Reload switch",
                "testing_plan": "Check BGP neighbor states",
                "rollback_plan": "Boot secondary partition",
                "expected_downtime_minutes": 15,
                "risk_assessment": {
                    "business_impact_score": 4,
                    "technical_complexity_score": 3,
                    "expected_downtime_score": 2,
                    "security_exposure_score": 2,
                    "rollback_difficulty_score": 2
                }
            },
            headers={"Authorization": f"Bearer dev-user:{agent.email}"}
        )
        assert res.status_code == 201
        chg_data = res.json()
        chg_id = chg_data["id"]
        assert chg_data["risk_level"] in ["medium", "high"]
        assert chg_data["status"] == "pending_cab"

        # 2. Manager / CAB approves change
        appr_res = client.post(
            f"/api/changes/{chg_id}/approve",
            json={"decision": "approved", "comments": "Approved by CAB quorum"},
            headers={"Authorization": f"Bearer dev-user:{mgr.email}"}
        )
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "approved"

def test_ai_support_assistant():
    """
    Test Module 3: Generative AI Assistant
    Chat with assistant -> Returns response and conversation persistence.
    """
    with Session(engine) as session:
        emp = get_or_create_user(session, "employee.ai@smartticket.local", "AI Employee", UserRole.EMPLOYEE)

        res = client.post(
            "/api/ai/chat",
            json={"message": "How do I configure my Corporate VPN access?"},
            headers={"Authorization": f"Bearer dev-user:{emp.email}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "conversation_id" in data
        assert "message" in data
        assert len(data["message"]["content"]) > 10

