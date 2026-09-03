import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse, PaginatedResponse, PaginationMeta
from apps.api.app.core.exceptions import EntityNotFoundError, ConflictError, BusinessRuleViolationError
from apps.api.app.core.security import get_password_hash
from apps.api.app.auth.dependencies import get_current_user, require_role
from apps.api.app.users.models import User, UserRole
from apps.api.app.users.schemas import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

CANONICAL_ROLES = {UserRole.ADMIN, UserRole.OPERATOR, UserRole.WORKER, UserRole.LABOUR}
MAX_ROLE_LIMITS = {
    UserRole.ADMIN: 3,
    UserRole.OPERATOR: 10,
}


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
    clean_email = user_in.email.lower().strip()
    if not clean_email.endswith("@adharshbhopal.in"):
        raise BusinessRuleViolationError("Only corporate @adharshbhopal.in email addresses are permitted.")

    if user_in.role in MAX_ROLE_LIMITS and user_in.is_active:
        active_count = await db.scalar(
            select(func.count(User.id)).where(User.role == user_in.role, User.is_active == True)
        ) or 0
        limit = MAX_ROLE_LIMITS[user_in.role]
        if active_count >= limit:
            raise BusinessRuleViolationError(
                f"Maximum limit of {limit} active {user_in.role.value} accounts reached (current: {active_count})."
            )

    existing = await db.scalar(select(User).where(User.email == clean_email))
    if existing:
        raise ConflictError(f"User with email '{user_in.email}' already exists.")

    new_user = User(
        email=clean_email,
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

    target_role = user_in.role if user_in.role is not None else user.role
    target_active = user_in.is_active if user_in.is_active is not None else user.is_active

    if target_role in MAX_ROLE_LIMITS and target_active:
        # If role is changing to a limited role or an inactive user of that role is being activated
        if (user_in.role is not None and user_in.role != user.role) or (user_in.is_active is True and not user.is_active):
            active_count = await db.scalar(
                select(func.count(User.id)).where(
                    User.role == target_role,
                    User.is_active == True,
                    User.id != user_id
                )
            ) or 0
            limit = MAX_ROLE_LIMITS[target_role]
            if active_count >= limit:
                raise BusinessRuleViolationError(
                    f"Maximum limit of {limit} active {target_role.value} accounts reached (current: {active_count})."
                )

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
