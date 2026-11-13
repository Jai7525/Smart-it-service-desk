from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
import uuid
from pydantic import BaseModel
from datetime import datetime

from smart_ticket.core.database import get_session
from smart_ticket.core.security import get_current_user
from smart_ticket.models import Notification, Profile, NotificationType

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


class NotificationRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: NotificationType
    is_read: bool
    related_incident_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NotificationRead])
def list_my_notifications(
    unread_only: bool = False,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    SRS FR-16: Retrieve in-app notifications for the logged-in user.
    """
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    notifications = session.exec(query.order_by(Notification.created_at.desc())).all()
    return notifications


@router.patch("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_as_read(
    notification_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Marks a notification as read.
    """
    notification = session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    notification.is_read = True
    session.add(notification)
    session.commit()
    return {"status": "success", "message": "Notification marked as read"}

