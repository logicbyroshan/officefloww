import uuid
from typing import Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from apps.api.app.core.database import get_db
from apps.api.app.core.security import decode_token
from apps.api.app.core.exceptions import AuthenticationError, PermissionDeniedError
from apps.api.app.users.models import User, UserRole
from apps.api.app.users.permissions import has_permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise AuthenticationError("Authorization header missing.")

    try:
        payload = decode_token(token)
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        if not user_id_str or token_type != "access":
            raise AuthenticationError("Invalid access token format.")
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise AuthenticationError("Invalid or expired access token.")

    query = select(User).where(User.id == user_id, User.is_active == True)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("User not found or account is deactivated.")
    return user


def require_role(*roles: UserRole) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role in (UserRole.OWNER, UserRole.ADMIN):
            return current_user
        if current_user.role not in roles:
            raise PermissionDeniedError(
                f"Role '{current_user.role.value}' is not authorized to access this resource."
            )
        return current_user
    return role_checker


def require_permission(permission: str) -> Callable:
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise PermissionDeniedError(
                f"User does not have required permission '{permission}'."
            )
        return current_user
    return permission_checker
