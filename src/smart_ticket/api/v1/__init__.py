from fastapi import APIRouter
from smart_ticket.api.v1.auth import router as auth_router
from smart_ticket.api.v1.incidents import router as incidents_router
from smart_ticket.api.v1.problems import router as problems_router
from smart_ticket.api.v1.analytics import router as analytics_router
from smart_ticket.api.v1.automation import router as automation_router
from smart_ticket.api.v1.notifications import router as notifications_router
from smart_ticket.api.v1.knowledge import router as knowledge_router
from smart_ticket.api.v1.admin import router as admin_router
from smart_ticket.api.v1.service_requests import router as service_requests_router, catalog_router
from smart_ticket.api.v1.changes import router as changes_router
from smart_ticket.api.v1.ai import router as ai_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(incidents_router)
api_router.include_router(problems_router)
api_router.include_router(analytics_router)
api_router.include_router(automation_router)
api_router.include_router(notifications_router)
api_router.include_router(knowledge_router)
api_router.include_router(admin_router)
api_router.include_router(catalog_router)
api_router.include_router(service_requests_router)
api_router.include_router(changes_router)
api_router.include_router(ai_router)
