import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse, PaginatedResponse, PaginationMeta
from apps.api.app.core.exceptions import EntityNotFoundError, ConflictError
from apps.api.app.core.security import get_password_hash
from apps.api.app.auth.dependencies import get_current_user, require_role
from apps.api.app.users.models import User, UserRole
from apps.api.app.users.schemas import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserRead])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        pattern = f"%{search}%"
        query = query.where((User.email.ilike(pattern)) | (User.full_name.ilike(pattern)))

    total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedResponse(
        data=[UserRead.model_validate(u) for u in users],
        meta=PaginationMeta.create(page=page, page_size=page_size, total=total),
    )


@router.post("", response_model=SuccessResponse[UserRead])
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)),
):
    existing = await db.scalar(select(User).where(User.email == user_in.email.lower().strip()))
    if existing:
        raise ConflictError(f"User with email '{user_in.email}' already exists.")

    new_user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role,
        is_active=user_in.is_active,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return SuccessResponse(data=UserRead.model_validate(new_user))


@router.get("/{user_id}", response_model=SuccessResponse[UserRead])
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise EntityNotFoundError("User", user_id)
    return SuccessResponse(data=UserRead.model_validate(user))


@router.patch("/{user_id}", response_model=SuccessResponse[UserRead])
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER)),
):
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise EntityNotFoundError("User", user_id)

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.phone is not None:
        user.phone = user_in.phone
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)

    await db.commit()
    await db.refresh(user)
    return SuccessResponse(data=UserRead.model_validate(user))
