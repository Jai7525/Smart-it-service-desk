import pytest
from httpx import AsyncClient, ASGITransport
from smart_ticket.main import app
from smart_ticket.core.database import init_db


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


@pytest.mark.anyio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "/docs" in data["docs_url"]


@pytest.mark.anyio
async def test_create_incident_end_to_end():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "subject": "VPN connection drops every 5 minutes",
            "description": "I cannot access internal company portal over wifi and vpn",
            "impact": "high",
            "urgency": "high",
            "location": "Building A, Floor 2"
        }
        response = await ac.post("/api/incidents/", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        # Automated Triage Assertions
        assert data["ticket_number"].startswith("INC-")
        assert data["category"] == "Network"
        assert data["priority"] == "critical"
        assert data["status"] == "open"
        assert data["response_deadline"] is not None
        assert data["resolution_deadline"] is not None

        incident_id = data["id"]

        # Status Update
        status_payload = {"status": "in_progress"}
        status_resp = await ac.patch(f"/api/incidents/{incident_id}/status", json=status_payload)
        assert status_resp.status_code == 200
        assert status_resp.json()["status"] == "in_progress"

        # Comments
        comment_payload = {"comment": "Checked router logs, investigating", "is_internal": False}
        comment_resp = await ac.post(f"/api/incidents/{incident_id}/comments", json=comment_payload)
        assert comment_resp.status_code == 201
        assert comment_resp.json()["comment"] == comment_payload["comment"]


@pytest.mark.anyio
async def test_problem_management():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        problem_payload = {
            "title": "Corporate Gateway VPN Flapping",
            "description": "Multiple users experiencing VPN disconnects",
            "category": "Network",
            "root_cause": "Firmware memory leak",
            "workaround": "Restart IPsec daemon",
            "permanent_solution": "Apply vendor hotfix v3.2"
        }
        response = await ac.post("/api/problems/", json=problem_payload)
        assert response.status_code == 201
        assert response.json()["title"] == problem_payload["title"]
