from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from sqlmodel import Session, select
from smart_ticket.models import Incident
from smart_ticket.core.config import settings


class IncidentCorrelationEngine:
    @staticmethod
    def detect_similar_incidents(
        session: Session,
        new_incident: Incident,
        time_window_minutes: int | None = None,
        threshold_count: int | None = None
    ) -> Tuple[bool, List[Incident]]:
        """
        Detects recurring/similar incidents within a rolling time window
        based on category, keyword overlap, and optional location.
        Returns: (is_major_alert_triggered, list_of_matching_incidents)
        """
        window = time_window_minutes or settings.SIMILARITY_TIME_WINDOW_MINUTES
        threshold = threshold_count or settings.SIMILARITY_THRESHOLD_COUNT
        
        cutoff_time = new_incident.created_at - timedelta(minutes=window)
        
        # Query recent incidents with same category within window
        query = select(Incident).where(
            Incident.id != new_incident.id,
            Incident.category == new_incident.category,
            Incident.created_at >= cutoff_time
        )
        recent_incidents = session.exec(query).all()
        
        # Extract keywords from new incident (words > 3 chars)
        def get_words(text: str) -> set[str]:
            return {w.lower() for w in text.split() if len(w) > 3}
            
        new_words = get_words(f"{new_incident.subject} {new_incident.description}")
        
        matched_incidents: List[Incident] = [new_incident]
        
        for inc in recent_incidents:
            inc_words = get_words(f"{inc.subject} {inc.description}")
            common = new_words.intersection(inc_words)
            
            # Location match boost or keyword overlap
            location_match = (
                new_incident.location 
                and inc.location 
                and new_incident.location.lower() == inc.location.lower()
            )
            
            if len(common) >= 2 or location_match:
                matched_incidents.append(inc)
                
        is_alert_triggered = len(matched_incidents) >= threshold
        return is_alert_triggered, matched_incidents

