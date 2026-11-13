from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import List, Optional
from sqlmodel import Session, select
from smart_ticket.core.config import settings
from smart_ticket.core.database import get_session
from smart_ticket.models import Profile, UserRole
import uuid

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session)
) -> Profile:
    """
    Decodes Supabase or local JWT token, validates user existence in DB.
    Provides mock fallback in local dev when no auth header is provided.
    """
    from fastapi import Request
    # If no token provided, try to find user by dev header or fallback
    if not credentials:
        # Development fallback: Find or create a default Admin user so testing is seamless
        dev_admin = session.exec(select(Profile).where(Profile.email == "admin@smartticket.local")).first()
        if not dev_admin:
            dev_admin = Profile(
                id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                email="admin@smartticket.local",
                full_name="Default System Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_available=True
            )
            session.add(dev_admin)
            session.commit()
            session.refresh(dev_admin)
        return dev_admin

    token = credentials.credentials
    email: Optional[str] = None
    try:
        # Decode JWT (compatible with Supabase JWT secret)
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[settings.ALGORITHM],
            options={"verify_aud": False}
        )
        email = payload.get("email")
    except Exception:
        # If token is a raw email or dev token (e.g. dev-token-email@...)
        if token.startswith("dev-user:"):
            email = token.replace("dev-user:", "")
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing email claim"
        )

    user = session.exec(select(Profile).where(Profile.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user


def require_roles(allowed_roles: List[UserRole]):
    """
    Dependency factory to enforce Role-Based Access Control (RBAC).
    """
    def role_checker(current_user: Profile = Depends(get_current_user)) -> Profile:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker

