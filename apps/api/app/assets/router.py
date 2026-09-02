from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.assets.schemas import (
    AssetCreate,
    AssetRead,
    AssetTypeCreate,
    AssetTypeRead,
    AssetAssignmentCreate,
    AssetAssignmentRead,
    AssetReturnRequest,
)
from apps.api.app.assets.service import AssetService
from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.users.models import User

router = APIRouter(prefix="/assets", tags=["Assets & Tools"])


@router.post("/types", response_model=SuccessResponse[AssetTypeRead], status_code=status.HTTP_201_CREATED)
async def create_asset_type(
    data: AssetTypeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    at = await AssetService.create_asset_type(db, data)
    return SuccessResponse(data=AssetTypeRead.model_validate(at))


@router.get("/types", response_model=SuccessResponse[List[AssetTypeRead]])
async def list_asset_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    types = await AssetService.get_asset_types(db)
    return SuccessResponse(data=[AssetTypeRead.model_validate(t) for t in types])


@router.post("", response_model=SuccessResponse[AssetRead], status_code=status.HTTP_201_CREATED)
async def create_asset(
    data: AssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    asset = await AssetService.create_asset(db, data)
    return SuccessResponse(data=AssetRead.model_validate(asset))


@router.get("", response_model=SuccessResponse[List[AssetRead]])
async def list_assets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    assets = await AssetService.get_assets(db)
    return SuccessResponse(data=[AssetRead.model_validate(a) for a in assets])


@router.get("/{id}", response_model=SuccessResponse[AssetRead])
async def get_asset(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    asset = await AssetService.get_asset(db, id)
    return SuccessResponse(data=AssetRead.model_validate(asset))


@router.post("/assignments", response_model=SuccessResponse[AssetAssignmentRead], status_code=status.HTTP_201_CREATED)
async def assign_asset(
    data: AssetAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:write")),
):
    assignment = await AssetService.assign_asset(db, data)
    return SuccessResponse(data=AssetAssignmentRead.model_validate(assignment))


@router.post("/{id}/return", response_model=SuccessResponse[AssetAssignmentRead])
async def return_asset(
    id: uuid.UUID,
    data: AssetReturnRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("tasks:complete")),
):
    assignment = await AssetService.return_asset(db, id, data)
    return SuccessResponse(data=AssetAssignmentRead.model_validate(assignment))
