import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from smart_ticket.core.database import init_db
from smart_ticket.core.config import settings
from smart_ticket.api.v1 import api_router
from smart_ticket.services.sla_watchdog import check_and_escalate_slas


async def run_sla_scheduler():
    """
    Background worker periodically running SLA breach checks every 60 seconds
    """
    while True:
        try:
            check_and_escalate_slas()
        except Exception as e:
            print(f"[SLA Watchdog Error]: {e}")
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    init_db()
    # Start SLA monitoring task
    task = asyncio.create_task(run_sla_scheduler())
    yield
    task.cancel()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Smart IT Service Desk & Workflow Automation Platform (FastAPI + Supabase)",
    lifespan=lifespan
)

# CORS configuration for React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }


def main():
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)


if __name__ == "__main__":
    main()
