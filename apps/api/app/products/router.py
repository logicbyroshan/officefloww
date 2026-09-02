import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse, PaginatedResponse, PaginationMeta
from apps.api.app.auth.dependencies import require_permission
from apps.api.app.users.models import User
from apps.api.app.products.schemas import (
    ProductCreate,
    ProductRead,
    ProductUpdate,
    BillOfMaterialsCreate,
    BillOfMaterialsRead,
)
from apps.api.app.products.service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedResponse[ProductRead])
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("products:read")),
):
    products, total = await ProductService.list_products(
        db=db,
        page=page,
        page_size=page_size,
        category_id=category_id,
        search=search,
        is_active=is_active,
    )
    return PaginatedResponse(
        data=[ProductRead.model_validate(p) for p in products],
        meta=PaginationMeta.create(page=page, page_size=page_size, total=total),
    )


@router.post("", response_model=SuccessResponse[ProductRead])
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("products:write")),
):
    product = await ProductService.create_product(db, product_in)
    return SuccessResponse(data=ProductRead.model_validate(product))


@router.get("/{product_id}", response_model=SuccessResponse[ProductRead])
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("products:read")),
):
    product = await ProductService.get_product(db, product_id)
    return SuccessResponse(data=ProductRead.model_validate(product))


@router.patch("/{product_id}", response_model=SuccessResponse[ProductRead])
async def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("products:write")),
):
    product = await ProductService.update_product(db, product_id, product_in)
    return SuccessResponse(data=ProductRead.model_validate(product))


@router.post("/{product_id}/boms", response_model=SuccessResponse[BillOfMaterialsRead])
async def add_product_bom(
    product_id: uuid.UUID,
    bom_in: BillOfMaterialsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("bom:write")),
):
    bom = await ProductService.add_bom(db, product_id, bom_in)
    return SuccessResponse(data=BillOfMaterialsRead.model_validate(bom))
