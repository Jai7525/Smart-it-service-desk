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
    Profile, UserRole, ServiceCatalogItem, ServiceRequest, ServiceApproval,
    Notification, NotificationType, SupportTeam
)
from pydantic import BaseModel

from pydantic import BaseModel, field_validator

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])
catalog_router = APIRouter(prefix="/service-catalog", tags=["Service Catalog"])


# --- Schemas ---
class ServiceCatalogItemRead(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    description: str
    icon: str
    estimated_delivery_hours: int
    requires_approval: bool
    required_fields: List[Dict[str, Any]]
    is_active: bool

    class Config:
        from_attributes = True


class ServiceRequestCreate(BaseModel):
    catalog_item_id: Optional[uuid.UUID] = None
    title: str
    category: str
    business_justification: str
    required_date: Optional[datetime] = None
    additional_notes: Optional[str] = None
    form_data: Dict[str, Any] = {}

    @field_validator('required_date', mode='after')
    @classmethod
    def ensure_timezone(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class ServiceApprovalDecision(BaseModel):
    decision: str  # "approved", "rejected", "info_requested"
    comments: Optional[str] = None


class ServiceStatusUpdate(BaseModel):
    status: str
    fulfillment_notes: Optional[str] = None
    assigned_agent_id: Optional[uuid.UUID] = None


# --- Catalog Endpoints ---
@catalog_router.get("/", response_model=List[ServiceCatalogItemRead])
def list_service_catalog(
    category: Optional[str] = None,
    session: Session = Depends(get_session)
):
    query = select(ServiceCatalogItem).where(ServiceCatalogItem.is_active == True)
    if category:
        query = query.where(ServiceCatalogItem.category == category)
    items = session.exec(query.order_by(ServiceCatalogItem.category, ServiceCatalogItem.name)).all()
    return items


@catalog_router.get("/{item_id}", response_model=ServiceCatalogItemRead)
def get_service_catalog_item(item_id: uuid.UUID, session: Session = Depends(get_session)):
    item = session.get(ServiceCatalogItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Service catalog item not found")
    return item


# --- Service Request Endpoints ---
@router.post("/", status_code=201)
def create_service_request(
    payload: ServiceRequestCreate,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Determine approval requirement from catalog item if selected
    catalog_item = None
    requires_approval = True
    if payload.catalog_item_id:
        catalog_item = session.get(ServiceCatalogItem, payload.catalog_item_id)
        if catalog_item:
            requires_approval = catalog_item.requires_approval

    # Generate request number
    count = session.exec(select(func.count(ServiceRequest.id))).one()
    req_number = f"REQ-{2001 + count}"

    initial_status = "pending_approval" if requires_approval else "approved"

    sr = ServiceRequest(
        request_number=req_number,
        requester_id=current_user.id,
        catalog_item_id=payload.catalog_item_id,
        title=payload.title,
        category=payload.category,
        business_justification=payload.business_justification,
        required_date=payload.required_date,
        additional_notes=payload.additional_notes,
        form_data=payload.form_data,
        status=initial_status
    )
    session.add(sr)
    session.commit()
    session.refresh(sr)

    # If requires approval, notify IT Managers / Dept heads
    if requires_approval:
        managers = session.exec(select(Profile).where(Profile.role == UserRole.MANAGER, Profile.is_active == True)).all()
        for mgr in managers:
            session.add(ServiceApproval(
                request_id=sr.id,
                approver_id=mgr.id,
                decision="pending"
            ))
            session.add(Notification(
                user_id=mgr.id,
                title="Service Request Awaiting Approval",
                message=f"Request {sr.request_number} ({sr.title}) by {current_user.full_name} requires your authorization.",
                type=NotificationType.INFO
            ))
        session.commit()
    else:
        # Notify agents that an approved request is in the fulfillment queue
        agents = session.exec(select(Profile).where(Profile.role == UserRole.AGENT, Profile.is_active == True)).all()
        for ag in agents:
            session.add(Notification(
                user_id=ag.id,
                title="New Service Request in Fulfillment Queue",
                message=f"Request {sr.request_number} ({sr.title}) was auto-approved and is ready for fulfillment.",
                type=NotificationType.ASSIGNMENT
            ))
        session.commit()

    return {
        "id": str(sr.id),
        "request_number": sr.request_number,
        "title": sr.title,
        "category": sr.category,
        "business_justification": sr.business_justification,
        "status": sr.status,
        "created_at": sr.created_at.isoformat() if sr.created_at else None
    }


@router.get("/")
def list_service_requests(
    status: Optional[str] = None,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(ServiceRequest)

    # RBAC: Employees see only their own requests
    if current_user.role == UserRole.EMPLOYEE:
        query = query.where(ServiceRequest.requester_id == current_user.id)
    # Agents see approved, in_progress, or fulfilled requests
    elif current_user.role == UserRole.AGENT:
        if not status:
            query = query.where(ServiceRequest.status.in_(["approved", "in_progress", "fulfilled"]))
    # Managers & Admins see all

    if status:
        query = query.where(ServiceRequest.status == status)

    requests = session.exec(query.order_by(ServiceRequest.created_at.desc())).all()

    # Enrich with requester, catalog_item, and approver details
    results = []
    for req in requests:
        requester = session.get(Profile, req.requester_id)
        catalog = session.get(ServiceCatalogItem, req.catalog_item_id) if req.catalog_item_id else None
        agent = session.get(Profile, req.assigned_agent_id) if req.assigned_agent_id else None
        approvals = session.exec(select(ServiceApproval).where(ServiceApproval.request_id == req.id)).all()

        results.append({
            **req.dict(),
            "requester_name": requester.full_name if requester else "Unknown",
            "requester_email": requester.email if requester else "",
            "catalog_name": catalog.name if catalog else req.title,
            "assigned_agent_name": agent.full_name if agent else None,
            "approvals": [
                {
                    "id": str(appr.id),
                    "approver_id": str(appr.approver_id),
                    "decision": appr.decision,
                    "comments": appr.comments,
                    "decision_at": appr.decision_at.isoformat() if appr.decision_at else None
                }
                for appr in approvals
            ]
        })

    return results


@router.get("/{request_id}")
def get_service_request_detail(
    request_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    req = session.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Access control
    if current_user.role == UserRole.EMPLOYEE and req.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this service request")

    requester = session.get(Profile, req.requester_id)
    catalog = session.get(ServiceCatalogItem, req.catalog_item_id) if req.catalog_item_id else None
    agent = session.get(Profile, req.assigned_agent_id) if req.assigned_agent_id else None
    approvals = session.exec(select(ServiceApproval).where(ServiceApproval.request_id == req.id)).all()

    approver_details = []
    for app in approvals:
        approver_profile = session.get(Profile, app.approver_id)
        approver_details.append({
            "id": str(app.id),
            "approver_name": approver_profile.full_name if approver_profile else "Manager",
            "decision": app.decision,
            "comments": app.comments,
            "decision_at": app.decision_at.isoformat() if app.decision_at else None
        })

    return {
        **req.dict(),
        "requester_name": requester.full_name if requester else "Unknown",
        "requester_email": requester.email if requester else "",
        "catalog_name": catalog.name if catalog else req.title,
        "estimated_delivery_hours": catalog.estimated_delivery_hours if catalog else 24,
        "assigned_agent_name": agent.full_name if agent else None,
        "approvals": approver_details
    }


@router.post("/{request_id}/approve")
def approve_service_request(
    request_id: uuid.UUID,
    payload: ServiceApprovalDecision,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Only Managers and Admins can approve
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only Managers or Administrators can approve service requests")

    req = session.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    now = get_utc_now()
    req.status = "approved"
    req.updated_at = now

    # Record or update approval entry
    approval = session.exec(
        select(ServiceApproval)
        .where(ServiceApproval.request_id == req.id, ServiceApproval.approver_id == current_user.id)
    ).first()

    if not approval:
        approval = ServiceApproval(
            request_id=req.id,
            approver_id=current_user.id,
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

    # Notify requester
    session.add(Notification(
        user_id=req.requester_id,
        title=f"Service Request {req.request_number} Approved",
        message=f"Your request has been approved by {current_user.full_name} and queued for fulfillment.",
        type=NotificationType.STATUS_UPDATE
    ))

    session.commit()
    session.refresh(req)
    return {"message": "Service request approved successfully", "status": req.status}


@router.post("/{request_id}/reject")
def reject_service_request(
    request_id: uuid.UUID,
    payload: ServiceApprovalDecision,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only Managers or Administrators can reject service requests")

    if not payload.comments or not payload.comments.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required")

    req = session.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    now = get_utc_now()
    req.status = "rejected"
    req.rejection_reason = payload.comments
    req.updated_at = now

    approval = session.exec(
        select(ServiceApproval)
        .where(ServiceApproval.request_id == req.id, ServiceApproval.approver_id == current_user.id)
    ).first()

    if not approval:
        approval = ServiceApproval(
            request_id=req.id,
            approver_id=current_user.id,
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
        user_id=req.requester_id,
        title=f"Service Request {req.request_number} Rejected",
        message=f"Your request was rejected by {current_user.full_name}. Reason: {payload.comments}",
        type=NotificationType.STATUS_UPDATE
    ))

    session.commit()
    session.refresh(req)
    return {"message": "Service request rejected", "status": req.status}


@router.patch("/{request_id}/status")
def update_service_request_status(
    request_id: uuid.UUID,
    payload: ServiceStatusUpdate,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.role not in [UserRole.AGENT, UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only IT Support Agents or Managers can update fulfillment status")

    req = session.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    now = get_utc_now()
    req.status = payload.status
    if payload.fulfillment_notes:
        req.fulfillment_notes = payload.fulfillment_notes
    if payload.assigned_agent_id:
        req.assigned_agent_id = payload.assigned_agent_id
    elif not req.assigned_agent_id and current_user.role == UserRole.AGENT:
        req.assigned_agent_id = current_user.id

    if payload.status == "fulfilled":
        req.fulfilled_at = now
        session.add(Notification(
            user_id=req.requester_id,
            title=f"Service Request {req.request_number} Fulfilled",
            message=f"Your request '{req.title}' has been completed by {current_user.full_name}.",
            type=NotificationType.STATUS_UPDATE
        ))

    req.updated_at = now
    session.add(req)
    session.commit()
    session.refresh(req)
    return req
