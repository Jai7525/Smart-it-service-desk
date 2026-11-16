import uuid
from datetime import datetime, timezone

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user
from smart_ticket.models import (
    Profile, UserRole, ChangeRequest, ChangeApproval,
    Notification, NotificationType
)
from pydantic import BaseModel, field_validator

router = APIRouter(prefix="/changes", tags=["Change Management"])


# --- Schemas ---
class RiskAssessmentInput(BaseModel):
    business_impact_score: int  # 1 (low) to 5 (critical)
    technical_complexity_score: int  # 1 to 5
    expected_downtime_score: int  # 1 to 5
    security_exposure_score: int  # 1 to 5
    rollback_difficulty_score: int  # 1 to 5


class ChangeRequestCreate(BaseModel):
    title: str
    description: str
    change_type: str = "normal"  # "standard", "normal", "emergency"
    category: str
    reason: str
    affected_service: str
    affected_departments: Optional[str] = None
    business_impact: str = "medium"
    proposed_start: datetime
    proposed_end: datetime
    implementation_plan: str
    testing_plan: str
    rollback_plan: str
    expected_downtime_minutes: int = 0
    assigned_owner_id: Optional[uuid.UUID] = None
    risk_assessment: Optional[RiskAssessmentInput] = None

    @field_validator('proposed_start', 'proposed_end', mode='after')
    @classmethod
    def ensure_timezone(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class ChangeApprovalDecision(BaseModel):
    decision: str  # "approved", "rejected"
    comments: Optional[str] = None


class ChangeStatusUpdate(BaseModel):
    status: str
    execution_notes: Optional[str] = None
    testing_results: Optional[str] = None
    rollback_status: Optional[str] = None
    review_notes: Optional[str] = None


def calculate_risk(assessment: Optional[RiskAssessmentInput]) -> tuple[float, str]:
    """
    Authoritative backend-calculated risk engine using weighted scoring.
    """
    if not assessment:
        return 2.50, "medium"

    score = (
        assessment.business_impact_score * 0.25 +
        assessment.technical_complexity_score * 0.20 +
        assessment.expected_downtime_score * 0.25 +
        assessment.security_exposure_score * 0.15 +
        assessment.rollback_difficulty_score * 0.15
    )
    score = round(score, 2)

    if score >= 4.0:
        level = "critical"
    elif score >= 3.0:
        level = "high"
    elif score >= 2.0:
        level = "medium"
    else:
        level = "low"

    return score, level


@router.post("/", status_code=201)
def create_change_request(
    payload: ChangeRequestCreate,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Only Agents, Managers, Admins can raise change requests
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Employees cannot submit infrastructure change requests")

    count = session.exec(select(func.count(ChangeRequest.id))).one()
    change_number = f"CHG-{3001 + count}"

    # Calculate authoritative risk score
    risk_score, risk_level = calculate_risk(payload.risk_assessment)

    # Standard changes are pre-approved; Normal/Emergency require approval
    initial_status = "approved" if payload.change_type == "standard" else "pending_cab"

    change = ChangeRequest(
        change_number=change_number,
        title=payload.title,
        description=payload.description,
        change_type=payload.change_type,
        category=payload.category,
        reason=payload.reason,
        affected_service=payload.affected_service,
        affected_departments=payload.affected_departments,
        business_impact=payload.business_impact,
        risk_level=risk_level,
        risk_score=risk_score,
        status=initial_status,
        requester_id=current_user.id,
        assigned_owner_id=payload.assigned_owner_id or current_user.id,
        proposed_start=payload.proposed_start,
        proposed_end=payload.proposed_end,
        implementation_plan=payload.implementation_plan,
        testing_plan=payload.testing_plan,
        rollback_plan=payload.rollback_plan,
        expected_downtime_minutes=payload.expected_downtime_minutes
    )
    session.add(change)
    session.commit()
    session.refresh(change)

    # If pending CAB approval, notify Managers and Admins
    if initial_status == "pending_cab":
        managers = session.exec(
            select(Profile).where(Profile.role.in_([UserRole.MANAGER, UserRole.ADMIN]), Profile.is_active == True)
        ).all()
        for mgr in managers:
            session.add(ChangeApproval(
                change_id=change.id,
                approver_id=mgr.id,
                role_type="cab",
                decision="pending"
            ))
            session.add(Notification(
                user_id=mgr.id,
                title=f"CAB Review Required: {change.change_number}",
                message=f"Change '{change.title}' ({change.change_type.upper()}) with {change.risk_level.upper()} risk awaits CAB authorization.",
                type=NotificationType.MAJOR_ALERT
            ))
        session.commit()

    return {
        "id": str(change.id),
        "change_number": change.change_number,
        "title": change.title,
        "change_type": change.change_type,
        "category": change.category,
        "risk_level": change.risk_level,
        "risk_score": float(change.risk_score),
        "status": change.status,
        "proposed_start": change.proposed_start.isoformat() if change.proposed_start else None,
        "proposed_end": change.proposed_end.isoformat() if change.proposed_end else None
    }


@router.get("/")
def list_change_requests(
    status: Optional[str] = None,
    change_type: Optional[str] = None,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(ChangeRequest)
    if status:
        if status in ["scheduled", "approved"]:
            query = query.where(ChangeRequest.status.in_(["scheduled", "approved"]))
        else:
            query = query.where(ChangeRequest.status == status)
    if change_type:
        query = query.where(ChangeRequest.change_type == change_type)

    changes = session.exec(query.order_by(ChangeRequest.proposed_start.desc())).all()

    results = []
    for chg in changes:
        requester = session.get(Profile, chg.requester_id)
        owner = session.get(Profile, chg.assigned_owner_id) if chg.assigned_owner_id else None
        approvals = session.exec(select(ChangeApproval).where(ChangeApproval.change_id == chg.id)).all()

        results.append({
            **chg.dict(),
            "requester_name": requester.full_name if requester else "Unknown",
            "owner_name": owner.full_name if owner else "Unassigned",
            "approval_count": len(approvals),
            "approved_count": len([a for a in approvals if a.decision == "approved"])
        })
    return results


@router.get("/calendar")
def get_change_calendar(
    session: Session = Depends(get_session)
):
    """
    Returns changes formatted for calendar schedule visualization.
    """
    changes = session.exec(select(ChangeRequest).order_by(ChangeRequest.proposed_start.asc())).all()
    calendar_events = []
    for chg in changes:
        owner = session.get(Profile, chg.assigned_owner_id) if chg.assigned_owner_id else None
        calendar_events.append({
            "id": str(chg.id),
            "title": f"[{chg.change_number}] {chg.title}",
            "start": chg.proposed_start.isoformat(),
            "end": chg.proposed_end.isoformat(),
            "change_type": chg.change_type,
            "risk_level": chg.risk_level,
            "status": chg.status,
            "affected_service": chg.affected_service,
            "owner": owner.full_name if owner else "Unassigned"
        })
    return calendar_events


@router.get("/{change_id}")
def get_change_request_detail(
    change_id: uuid.UUID,
    session: Session = Depends(get_session)
):
    chg = session.get(ChangeRequest, change_id)
    if not chg:
        raise HTTPException(status_code=404, detail="Change request not found")

    requester = session.get(Profile, chg.requester_id)
    owner = session.get(Profile, chg.assigned_owner_id) if chg.assigned_owner_id else None
    approvals = session.exec(select(ChangeApproval).where(ChangeApproval.change_id == chg.id)).all()

    approver_details = []
    for app in approvals:
        p = session.get(Profile, app.approver_id)
        approver_details.append({
            "id": str(app.id),
            "approver_name": p.full_name if p else "CAB Reviewer",
            "role_type": app.role_type,
            "decision": app.decision,
            "comments": app.comments,
            "decision_at": app.decision_at.isoformat() if app.decision_at else None
        })

    return {
        **chg.dict(),
        "requester_name": requester.full_name if requester else "Unknown",
        "owner_name": owner.full_name if owner else "Unassigned",
        "approvals": approver_details
    }


@router.post("/{change_id}/approve")
def approve_change_request(
    change_id: uuid.UUID,
    payload: ChangeApprovalDecision,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only Managers or CAB Members can authorize changes")

    chg = session.get(ChangeRequest, change_id)
    if not chg:
        raise HTTPException(status_code=404, detail="Change request not found")

    now = get_utc_now()
    chg.status = "scheduled"
    chg.updated_at = now

    approval = session.exec(
        select(ChangeApproval)
        .where(ChangeApproval.change_id == chg.id, ChangeApproval.approver_id == current_user.id)
    ).first()

    if not approval:
        approval = ChangeApproval(
            change_id=chg.id,
            approver_id=current_user.id,
            role_type="cab",
            decision="approved",
            comments=payload.comments,
            decision_at=now
        )
        session.add(approval)
    else:
        approval.decision = "approved"
        approval.comments = payload.comments
        approval.decision_at = now
        session.add(approval)

    session.add(Notification(
        user_id=chg.requester_id,
        title=f"Change {chg.change_number} Approved by CAB",
        message=f"Change '{chg.title}' approved by {current_user.full_name}. Implementation may proceed per schedule.",
        type=NotificationType.STATUS_UPDATE
    ))

    session.commit()
    session.refresh(chg)
    return {"message": "Change approved successfully", "status": chg.status}


@router.post("/{change_id}/reject")
def reject_change_request(
    change_id: uuid.UUID,
    payload: ChangeApprovalDecision,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only Managers or CAB Members can reject changes")

    if not payload.comments:
        raise HTTPException(status_code=400, detail="Rejection reason is required")

    chg = session.get(ChangeRequest, change_id)
    if not chg:
        raise HTTPException(status_code=404, detail="Change request not found")

    now = get_utc_now()
    chg.status = "rejected"
    chg.rejection_reason = payload.comments
    chg.updated_at = now

    approval = session.exec(
        select(ChangeApproval)
        .where(ChangeApproval.change_id == chg.id, ChangeApproval.approver_id == current_user.id)
    ).first()

    if not approval:
        approval = ChangeApproval(
            change_id=chg.id,
            approver_id=current_user.id,
            role_type="cab",
            decision="rejected",
            comments=payload.comments,
            decision_at=now
        )
        session.add(approval)
    else:
        approval.decision = "rejected"
        approval.comments = payload.comments
        approval.decision_at = now
        session.add(approval)

    session.add(Notification(
        user_id=chg.requester_id,
        title=f"Change {chg.change_number} Rejected by CAB",
        message=f"Change '{chg.title}' was rejected by {current_user.full_name}. Reason: {payload.comments}",
        type=NotificationType.STATUS_UPDATE
    ))

    session.commit()
    session.refresh(chg)
    return {"message": "Change rejected", "status": chg.status}


@router.patch("/{change_id}/status")
def update_change_status(
    change_id: uuid.UUID,
    payload: ChangeStatusUpdate,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [UserRole.AGENT, UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized to update change implementation state")

    chg = session.get(ChangeRequest, change_id)
    if not chg:
        raise HTTPException(status_code=404, detail="Change request not found")

    now = get_utc_now()
    chg.status = payload.status
    if payload.execution_notes:
        chg.execution_notes = payload.execution_notes
    if payload.testing_results:
        chg.testing_results = payload.testing_results
    if payload.rollback_status:
        chg.rollback_status = payload.rollback_status
    if payload.review_notes:
        chg.review_notes = payload.review_notes

    if payload.status == "in_progress" and not chg.actual_start:
        chg.actual_start = now
    elif payload.status in ["completed", "failed", "rolled_back"] and not chg.actual_end:
        chg.actual_end = now

    chg.updated_at = now
    session.add(chg)
    session.commit()
    session.refresh(chg)
    return chg
