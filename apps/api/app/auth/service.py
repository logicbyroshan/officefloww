import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from apps.api.app.core.config import settings
from apps.api.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from apps.api.app.core.exceptions import AuthenticationError, ConflictError
from apps.api.app.users.models import User, RefreshToken, UserRole
from apps.api.app.users.schemas import UserCreate, UserRead
from apps.api.app.auth.schemas import LoginRequest, TokenResponse


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AuthService:
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
        clean_email = email.lower().strip()
        query = select(User).where(User.email == clean_email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user and "@adharshbhopal.in" in clean_email:
            alt_email = clean_email.replace("@adharshbhopal.in", "@officefloww.com")
            query = select(User).where(User.email == alt_email)
            result = await db.execute(query)
            user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def login(db: AsyncSession, login_data: LoginRequest) -> TokenResponse:
        user = await AuthService.authenticate_user(db, login_data.email, login_data.password)
        if not user:
            raise AuthenticationError("Invalid email or password.")
        if not user.is_active:
            raise AuthenticationError("User account is inactive.")

        user.last_login_at = datetime.now(timezone.utc)

        # Generate tokens
        access_token = create_access_token(str(user.id), user.role.value)
        refresh_token = create_refresh_token(str(user.id))

        # Store hashed refresh token in database
        hashed_rt = _hash_token(refresh_token)
        rt_record = RefreshToken(
            user_id=user.id,
            token_hash=hashed_rt,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            device_info=login_data.device_info,
        )
        db.add(rt_record)
        await db.commit()
        await db.refresh(user)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.model_validate(user),
        )

    @staticmethod
    async def refresh(db: AsyncSession, refresh_token_str: str) -> TokenResponse:
        try:
            payload = decode_token(refresh_token_str)
            user_id_str = payload.get("sub")
            token_type = payload.get("type")
            if not user_id_str or token_type != "refresh":
                raise AuthenticationError("Invalid refresh token.")
            user_id = uuid.UUID(user_id_str)
        except (jwt.PyJWTError, ValueError):
            raise AuthenticationError("Invalid or expired refresh token.")

        hashed_rt = _hash_token(refresh_token_str)
        query = select(RefreshToken).where(
            RefreshToken.token_hash == hashed_rt,
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,
        )
        result = await db.execute(query)
        stored_token = result.scalar_one_or_none()
        if not stored_token:
            raise AuthenticationError("Refresh token is expired or revoked.")

        expires_at = stored_token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            raise AuthenticationError("Refresh token is expired or revoked.")

        # Revoke old refresh token (rotation)
        stored_token.revoked = True

        # Fetch user
        user_query = select(User).where(User.id == user_id, User.is_active == True)
        user_res = await db.execute(user_query)
        user = user_res.scalar_one_or_none()
        if not user:
            raise AuthenticationError("User not found or inactive.")

        # Generate new pair
        new_access_token = create_access_token(str(user.id), user.role.value)
        new_refresh_token = create_refresh_token(str(user.id))

        new_rt_record = RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(new_refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            device_info=stored_token.device_info,
        )
        db.add(new_rt_record)
        await db.commit()
        await db.refresh(user)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserRead.model_validate(user),
        )

    @staticmethod
    async def logout(db: AsyncSession, refresh_token_str: Optional[str] = None):
        if refresh_token_str:
            hashed_rt = _hash_token(refresh_token_str)
            await db.execute(
                update(RefreshToken)
                .where(RefreshToken.token_hash == hashed_rt)
                .values(revoked=True)
            )
            await db.commit()
        return True
