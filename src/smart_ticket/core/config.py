from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart IT Service Desk & Workflow Automation Platform"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./smart_ticket.db"
    
    # Supabase / JWT Auth
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: str = "supersecret-dev-key-change-in-production"
    ALGORITHM: str = "HS256"
    
    # SLA Defaults (in hours)
    SLA_CRITICAL_RESPONSE_HOURS: float = 0.5
    SLA_CRITICAL_RESOLUTION_HOURS: float = 2.0
    SLA_HIGH_RESPONSE_HOURS: float = 1.0
    SLA_HIGH_RESOLUTION_HOURS: float = 4.0
    SLA_MEDIUM_RESPONSE_HOURS: float = 4.0
    SLA_MEDIUM_RESOLUTION_HOURS: float = 24.0
    SLA_LOW_RESPONSE_HOURS: float = 8.0
    SLA_LOW_RESOLUTION_HOURS: float = 48.0
    
    # Similar Incident Detection (PRD 5.4, SRS FR-10)
    SIMILARITY_TIME_WINDOW_MINUTES: int = 10
    SIMILARITY_THRESHOLD_COUNT: int = 5

    # Intelligent Workload Balancing (Phase 2)
    MAX_ACTIVE_TICKETS_PER_AGENT: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

