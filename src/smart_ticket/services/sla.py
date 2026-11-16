from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlmodel import Session, select
from smart_ticket.models import PriorityLevel, SLAPolicy
from smart_ticket.core.config import settings


class SLAEngine:
    @staticmethod
    def calculate_deadlines(
        priority: PriorityLevel,
        start_time: datetime | None = None,
        session: Optional[Session] = None
    ) -> Tuple[datetime, datetime]:
        """
        Calculates response and resolution deadlines dynamically:
        1. Checks database SLAPolicy table for customized targets configured via Admin UI.
        2. Falls back to environment settings if not found in DB.
        Returns: (response_deadline, resolution_deadline)
        """
        if start_time is None:
            start_time = datetime.now(timezone.utc)
            
        resp_hours = None
        res_hours = None

        if session:
            try:
                db_policy = session.exec(
                    select(SLAPolicy).where(SLAPolicy.priority == priority)
                ).first()
                if db_policy:
                    resp_hours = db_policy.response_time_hours
                    res_hours = db_policy.resolution_time_hours
            except Exception:
                pass

        if resp_hours is None or res_hours is None:
            if priority == PriorityLevel.CRITICAL:
                resp_hours = settings.SLA_CRITICAL_RESPONSE_HOURS
                res_hours = settings.SLA_CRITICAL_RESOLUTION_HOURS
            elif priority == PriorityLevel.HIGH:
                resp_hours = settings.SLA_HIGH_RESPONSE_HOURS
                res_hours = settings.SLA_HIGH_RESOLUTION_HOURS
            elif priority == PriorityLevel.MEDIUM:
                resp_hours = settings.SLA_MEDIUM_RESPONSE_HOURS
                res_hours = settings.SLA_MEDIUM_RESOLUTION_HOURS
            else:  # LOW
                resp_hours = settings.SLA_LOW_RESPONSE_HOURS
                res_hours = settings.SLA_LOW_RESOLUTION_HOURS
            
        response_deadline = start_time + timedelta(hours=resp_hours)
        resolution_deadline = start_time + timedelta(hours=res_hours)
        
        return response_deadline, resolution_deadline


