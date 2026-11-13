import re
from typing import Tuple, Optional
from smart_ticket.models import IncidentCategory

# PRD 5.1 & SRS FR-05 Predefined Keywords
CATEGORY_KEYWORD_MAPPINGS = {
    IncidentCategory.NETWORK: [
        "wifi", "wi-fi", "vpn", "internet", "lan", "dns", "router", "switch",
        "connection", "network", "bandwidth", "slow internet", "ethernet"
    ],
    IncidentCategory.HARDWARE: [
        "laptop", "keyboard", "mouse", "monitor", "screen", "printer", "battery",
        "charger", "cpu", "hard drive", "ssd", "webcam", "headphone", "device"
    ],
    IncidentCategory.SOFTWARE: [
        "installation", "application", "software", "crash", "bug", "freeze",
        "update", "excel", "outlook", "browser", "chrome", "teams", "slack", "os"
    ],
    IncidentCategory.ACCESS: [
        "password", "login", "access", "permission", "unlock", "account",
        "mfa", "2fa", "authentication", "credential", "reset password", "sso"
    ]
}


class ClassificationEngine:
    @staticmethod
    def classify(subject: str, description: str) -> Tuple[IncidentCategory, Optional[str]]:
        """
        Classifies incident text using predefined keyword matching with standard fallback.
        Returns: (IncidentCategory, subcategory)
        """
        text = f"{subject} {description}".lower()
        
        # Check against mapped categories in priority order
        for category, keywords in CATEGORY_KEYWORD_MAPPINGS.items():
            for kw in keywords:
                # Use word-boundary regex when possible for precise match
                pattern = rf"\b{re.escape(kw)}\b"
                if re.search(pattern, text):
                    # Subcategory can be set to the matched keyword
                    return category, kw.capitalize()
                    
        return IncidentCategory.GENERAL, "Uncategorized"

