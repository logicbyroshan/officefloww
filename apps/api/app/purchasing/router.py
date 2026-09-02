from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.purchasing.schemas import (
    SupplierCreate,
    SupplierRead,
    SupplierProductCreate,
    SupplierProductRead,
    PurchaseOrderCreate,
    PurchaseOrderRead,
    GoodsReceiptCreate,
    GoodsReceiptRead,
    PriceTrendsRead,
)
from apps.api.app.purchasing.service import PurchasingService
from apps.api.app.users.models import User

router = APIRouter(prefix="/purchasing", tags=["Purchasing & Suppliers"])


@router.post("/suppliers", response_model=SuccessResponse[SupplierRead], status_code=status.HTTP_201_CREATED)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    supplier = await PurchasingService.create_supplier(db, data)
    return SuccessResponse(data=SupplierRead.model_validate(supplier))


@router.get("/suppliers", response_model=SuccessResponse[List[SupplierRead]])
async def list_suppliers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    suppliers = await PurchasingService.get_suppliers(db)
    return SuccessResponse(data=[SupplierRead.model_validate(s) for s in suppliers])


@router.get("/suppliers/{id}", response_model=SuccessResponse[SupplierRead])
async def get_supplier(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    supplier = await PurchasingService.get_supplier(db, id)
    return SuccessResponse(data=SupplierRead.model_validate(supplier))


@router.post("/supplier-products", response_model=SuccessResponse[SupplierProductRead], status_code=status.HTTP_201_CREATED)
async def add_supplier_product(
    data: SupplierProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    sp = await PurchasingService.add_supplier_product(db, data)
    return SuccessResponse(data=SupplierProductRead.model_validate(sp))


@router.post("/orders", response_model=SuccessResponse[PurchaseOrderRead], status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    po = await PurchasingService.create_purchase_order(db, data, creator_id=current_user.id)
    return SuccessResponse(data=PurchaseOrderRead.model_validate(po))


@router.post("/orders/{id}/approve", response_model=SuccessResponse[PurchaseOrderRead])
async def approve_purchase_order(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:approve")),
):
    po = await PurchasingService.approve_purchase_order(db, id, approver_id=current_user.id)
    return SuccessResponse(data=PurchaseOrderRead.model_validate(po))


@router.post("/goods-receipts", response_model=SuccessResponse[GoodsReceiptRead], status_code=status.HTTP_201_CREATED)
async def receive_goods(
    data: GoodsReceiptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    grn = await PurchasingService.receive_goods(db, data, receiver_id=current_user.id)
    return SuccessResponse(data=GoodsReceiptRead.model_validate(grn))


@router.get("/items/{stock_item_id}/price-trends", response_model=SuccessResponse[PriceTrendsRead])
async def get_item_price_trends(
    stock_item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:read")),
):
    trends = await PurchasingService.get_price_trends(db, stock_item_id)
    return SuccessResponse(data=trends)
