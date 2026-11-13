import uuid
from typing import List, Dict, Any
from sqlmodel import Session, select
from smart_ticket.models import AutomationRule, AutomationLog, Incident, Notification, NotificationType, Profile, UserRole


class WorkflowAutomationEngine:
    @staticmethod
    def evaluate_rules(
        session: Session,
        trigger: str,
        incident: Incident
    ) -> List[AutomationLog]:
        """
        FR-13 & PRD 5.6: Trigger-Condition-Action (TCA) Engine.
        Evaluates active rules matching the trigger event and executes their actions.
        """
        # Fetch active rules for this trigger
        rules = session.exec(
            select(AutomationRule).where(
                AutomationRule.trigger == trigger,
                AutomationRule.is_active == True
            )
        ).all()

        logs: List[AutomationLog] = []

        for rule in rules:
            conditions_met = True
            
            # Evaluate conditions against incident fields
            if rule.conditions:
                for field, expected_val in rule.conditions.items():
                    actual_val = getattr(incident, field, None)
                    # Convert enums to str for flexible comparison
                    if actual_val is not None and hasattr(actual_val, "value"):
                        actual_val = actual_val.value

                    if actual_val != expected_val:
                        conditions_met = False
                        break

            if conditions_met:
                # Execute actions
                for action in rule.actions:
                    action_type = action.get("type")
                    status = "success"
                    details = ""

                    try:
                        if action_type == "notify_manager":
                            managers = session.exec(
                                select(Profile).where(
                                    Profile.role == UserRole.MANAGER,
                                    Profile.is_active == True
                                )
                            ).all()
                            msg = action.get("message", f"Incident {incident.ticket_number} triggered rule: {rule.name}")
                            for mgr in managers:
                                n = Notification(
                                    user_id=mgr.id,
                                    title=f"Automation Alert: {rule.name}",
                                    message=msg,
                                    type=NotificationType.INFO,
                                    related_incident_id=incident.id
                                )
                                session.add(n)
                            details = f"Notified {len(managers)} managers"

                        elif action_type == "escalate_priority":
                            new_priority = action.get("priority")
                            if new_priority:
                                incident.priority = new_priority
                                session.add(incident)
                                details = f"Escalated priority to {new_priority}"

                        elif action_type == "send_notification":
                            user_id_str = action.get("user_id")
                            if user_id_str:
                                n = Notification(
                                    user_id=uuid.UUID(user_id_str),
                                    title=action.get("title", "Notification"),
                                    message=action.get("message", ""),
                                    type=NotificationType.INFO,
                                    related_incident_id=incident.id
                                )
                                session.add(n)
                            details = "Notification sent"
                        else:
                            details = f"Action {action_type} executed"

                    except Exception as e:
                        status = "failed"
                        details = str(e)

                    log = AutomationLog(
                        rule_id=rule.id,
                        trigger=trigger,
                        incident_id=incident.id,
                        action_taken=action_type or "unknown",
                        status=status,
                        details=details
                    )
                    session.add(log)
                    logs.append(log)

        session.commit()
        return logs

