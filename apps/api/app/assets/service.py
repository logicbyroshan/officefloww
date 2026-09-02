from datetime import datetime, timezone
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.assets.models import Asset, AssetAssignment, AssetType, AssetCondition
from apps.api.app.assets.schemas import AssetCreate, AssetTypeCreate, AssetAssignmentCreate, AssetReturnRequest
from apps.api.app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError


class AssetService:
    @staticmethod
    async def create_asset_type(db: AsyncSession, data: AssetTypeCreate) -> AssetType:
        existing = await db.execute(select(AssetType).where(AssetType.code == data.code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"AssetType with code '{data.code}' already exists.")
        at = AssetType(**data.model_dump())
        db.add(at)
        await db.commit()
        await db.refresh(at)
        return at

    @staticmethod
    async def get_asset_types(db: AsyncSession) -> List[AssetType]:
        res = await db.execute(select(AssetType).order_by(AssetType.name))
        return list(res.scalars().all())

    @staticmethod
    async def create_asset(db: AsyncSession, data: AssetCreate) -> Asset:
        existing = await db.execute(select(Asset).where(Asset.asset_code == data.asset_code))
        if existing.scalar_one_or_none():
            raise BusinessRuleViolationError(f"Asset with code '{data.asset_code}' already exists.")
        asset = Asset(**data.model_dump())
        db.add(asset)
        await db.commit()
        await db.refresh(asset)
        return asset

    @staticmethod
    async def get_assets(db: AsyncSession) -> List[Asset]:
        res = await db.execute(select(Asset).order_by(Asset.name))
        return list(res.scalars().all())

    @staticmethod
    async def get_asset(db: AsyncSession, asset_id: uuid.UUID) -> Asset:
        res = await db.execute(select(Asset).where(Asset.id == asset_id))
        asset = res.scalar_one_or_none()
        if not asset:
            raise EntityNotFoundError("Asset", asset_id)
        return asset

    @staticmethod
    async def assign_asset(db: AsyncSession, data: AssetAssignmentCreate) -> AssetAssignment:
        asset = await AssetService.get_asset(db, data.asset_id)

        # Check if already assigned
        active_res = await db.execute(
            select(AssetAssignment).where(
                AssetAssignment.asset_id == asset.id,
                AssetAssignment.returned_at == None,
            )
        )
        if active_res.scalar_one_or_none():
            raise BusinessRuleViolationError(f"Asset '{asset.asset_code}' is currently checked out.")

        assignment = AssetAssignment(
            asset_id=asset.id,
            assigned_to_user_id=data.assigned_to_user_id,
            assigned_to_labourer_id=data.assigned_to_labourer_id,
            condition_on_issue=data.condition_on_issue,
            notes=data.notes,
        )
        db.add(assignment)

        asset.current_holder_id = data.assigned_to_user_id or data.assigned_to_labourer_id
        asset.condition = data.condition_on_issue

        await db.commit()
        await db.refresh(assignment)
        return assignment

    @staticmethod
    async def return_asset(db: AsyncSession, asset_id: uuid.UUID, data: AssetReturnRequest) -> AssetAssignment:
        asset = await AssetService.get_asset(db, asset_id)

        active_res = await db.execute(
            select(AssetAssignment).where(
                AssetAssignment.asset_id == asset.id,
                AssetAssignment.returned_at == None,
            )
        )
        assignment = active_res.scalar_one_or_none()
        if not assignment:
            raise BusinessRuleViolationError(f"No active checkout found for asset '{asset.asset_code}'.")

        assignment.returned_at = datetime.now(timezone.utc)
        assignment.condition_on_return = data.condition_on_return
        if data.notes:
            assignment.notes = f"{assignment.notes or ''}; Return note: {data.notes}"

        asset.current_holder_id = None
        asset.condition = data.condition_on_return

        await db.commit()
        await db.refresh(assignment)
        return assignment
