from datetime import datetime, timedelta, timezone
from typing import Tuple
from smart_ticket.models import PriorityLevel
from smart_ticket.core.config import settings


class SLAEngine:
    @staticmethod
    def calculate_deadlines(
        priority: PriorityLevel,
        start_time: datetime | None = None
    ) -> Tuple[datetime, datetime]:
        """
        Calculates response and resolution deadlines based on Priority.
        Returns: (response_deadline, resolution_deadline)
        """
        if start_time is None:
            start_time = datetime.now(timezone.utc)
            
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

