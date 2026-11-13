from smart_ticket.models import ImpactLevel, UrgencyLevel, PriorityLevel

# PRD 5.2 & SRS FR-06 Decision Matrix
# | Impact / Urgency | High     | Medium | Low    |
# | High             | Critical | High   | Medium |
# | Medium           | High     | Medium | Low    |
# | Low              | Medium   | Low    | Low    |

PRIORITY_MATRIX = {
    (ImpactLevel.HIGH, UrgencyLevel.HIGH): PriorityLevel.CRITICAL,
    (ImpactLevel.HIGH, UrgencyLevel.MEDIUM): PriorityLevel.HIGH,
    (ImpactLevel.HIGH, UrgencyLevel.LOW): PriorityLevel.MEDIUM,
    
    (ImpactLevel.MEDIUM, UrgencyLevel.HIGH): PriorityLevel.HIGH,
    (ImpactLevel.MEDIUM, UrgencyLevel.MEDIUM): PriorityLevel.MEDIUM,
    (ImpactLevel.MEDIUM, UrgencyLevel.LOW): PriorityLevel.LOW,
    
    (ImpactLevel.LOW, UrgencyLevel.HIGH): PriorityLevel.MEDIUM,
    (ImpactLevel.LOW, UrgencyLevel.MEDIUM): PriorityLevel.LOW,
    (ImpactLevel.LOW, UrgencyLevel.LOW): PriorityLevel.LOW,
}


class PriorityEngine:
    @staticmethod
    def calculate_priority(impact: ImpactLevel, urgency: UrgencyLevel) -> PriorityLevel:
        """
        Determines incident priority using the standard 3x3 Impact vs. Urgency matrix.
        """
        return PRIORITY_MATRIX.get((impact, urgency), PriorityLevel.MEDIUM)

