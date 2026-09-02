from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.stock.schemas import (
    StockBalanceRead,
    StockItemCreate,
    StockItemRead,
    StockLocationCreate,
    StockLocationRead,
    StockLotCreate,
    StockMovementCreate,
    StockMovementRead,
    OrderBOMCalculationResponse,
)
from apps.api.app.stock.service import StockService
from apps.api.app.users.models import User

router = APIRouter(prefix="/stock", tags=["Stock & Inventory"])


@router.post("/locations", response_model=SuccessResponse[StockLocationRead], status_code=status.HTTP_201_CREATED)
async def create_location(
    data: StockLocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:write")),
):
    loc = await StockService.create_location(db, data)
    return SuccessResponse(data=StockLocationRead.model_validate(loc))


@router.get("/locations", response_model=SuccessResponse[List[StockLocationRead]])
async def list_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:read")),
):
    locs = await StockService.get_locations(db)
    return SuccessResponse(data=[StockLocationRead.model_validate(l) for l in locs])


@router.post("/items", response_model=SuccessResponse[StockItemRead], status_code=status.HTTP_201_CREATED)
async def create_item(
    data: StockItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:write")),
):
    item = await StockService.create_item(db, data)
    return SuccessResponse(data=StockItemRead.model_validate(item))


@router.get("/items", response_model=SuccessResponse[List[StockItemRead]])
async def list_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:read")),
):
    items = await StockService.get_items(db)
    return SuccessResponse(data=[StockItemRead.model_validate(i) for i in items])


@router.get("/items/{id}", response_model=SuccessResponse[StockItemRead])
async def get_item(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:read")),
):
    item = await StockService.get_item(db, id)
    return SuccessResponse(data=StockItemRead.model_validate(item))


@router.get("/items/{id}/balance", response_model=SuccessResponse[StockBalanceRead])
async def get_item_balance(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:read")),
):
    balance = await StockService.get_stock_balance(db, id)
    return SuccessResponse(data=balance)


@router.post("/lots", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def create_stock_lot(
    data: StockLotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:write")),
):
    lot = await StockService.create_lot(db, data)
    return SuccessResponse(data={"id": str(lot.id), "lot_number": lot.lot_number, "stock_item_id": str(lot.stock_item_id)})


@router.post("/movements", response_model=SuccessResponse[StockMovementRead], status_code=status.HTTP_201_CREATED)
async def record_stock_movement(
    data: StockMovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:write")),
):
    movement = await StockService.record_movement(db, data, actor_id=current_user.id)
    return SuccessResponse(data=StockMovementRead.model_validate(movement))


@router.post(
    "/orders/{order_id}/items/{order_item_id}/calculate-bom",
    response_model=SuccessResponse[OrderBOMCalculationResponse],
)
async def calculate_order_item_bom(
    order_id: uuid.UUID,
    order_item_id: uuid.UUID,
    auto_reserve: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    calc = await StockService.calculate_bom_and_reserve(
        db, order_id=order_id, order_item_id=order_item_id, auto_reserve=auto_reserve
    )
    return SuccessResponse(data=calc)


@router.get(
    "/traceability/lot/{lot_id}",
    response_model=SuccessResponse[dict],
)
async def get_stock_lot_traceability(
    lot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("ledger:read")),
):
    trace = await StockService.get_lot_traceability(db, lot_id=lot_id)
    return SuccessResponse(data=trace)

