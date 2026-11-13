import pytest
from smart_ticket.models import ImpactLevel, UrgencyLevel, PriorityLevel, IncidentCategory
from smart_ticket.services.classification import ClassificationEngine
from smart_ticket.services.priority import PriorityEngine
from smart_ticket.services.sla import SLAEngine


def test_classification_engine():
    # Network check
    cat, sub = ClassificationEngine.classify("Slow Wi-Fi connection", "The wifi in office 3 is dropping")
    assert cat == IncidentCategory.NETWORK
    assert sub == "Wifi"

    # Hardware check
    cat, sub = ClassificationEngine.classify("Broken Keyboard", "My laptop keyboard is missing keys")
    assert cat == IncidentCategory.HARDWARE
    assert sub == "Laptop"

    # Access check
    cat, sub = ClassificationEngine.classify("Forgot Password", "Need a password reset for my account")
    assert cat == IncidentCategory.ACCESS
    assert sub == "Password"

    # Fallback to General
    cat, sub = ClassificationEngine.classify("Coffee machine empty", "Please refill coffee beans")
    assert cat == IncidentCategory.GENERAL
    assert sub == "Uncategorized"


def test_priority_matrix():
    # High x High = Critical
    assert PriorityEngine.calculate_priority(ImpactLevel.HIGH, UrgencyLevel.HIGH) == PriorityLevel.CRITICAL
    
    # High x Medium = High
    assert PriorityEngine.calculate_priority(ImpactLevel.HIGH, UrgencyLevel.MEDIUM) == PriorityLevel.HIGH
    
    # Medium x Medium = Medium
    assert PriorityEngine.calculate_priority(ImpactLevel.MEDIUM, UrgencyLevel.MEDIUM) == PriorityLevel.MEDIUM
    
    # Low x Low = Low
    assert PriorityEngine.calculate_priority(ImpactLevel.LOW, UrgencyLevel.LOW) == PriorityLevel.LOW
    
    # Low x High = Medium
    assert PriorityEngine.calculate_priority(ImpactLevel.LOW, UrgencyLevel.HIGH) == PriorityLevel.MEDIUM


def test_sla_calculation():
    resp_crit, res_crit = SLAEngine.calculate_deadlines(PriorityLevel.CRITICAL)
    # Critical SLA: response 0.5 hours, resolution 2.0 hours
    assert (res_crit - resp_crit).total_seconds() > 0
    assert (res_crit - resp_crit).total_seconds() == 1.5 * 3600

