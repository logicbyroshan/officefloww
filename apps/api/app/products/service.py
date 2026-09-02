import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import EntityNotFoundError, ConflictError
from apps.api.app.products.models import Product, ProductCategory, BillOfMaterials, BOMItem
from apps.api.app.products.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductCategoryCreate,
    BillOfMaterialsCreate,
)


class ProductService:
    @staticmethod
    async def list_products(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        category_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[Product], int]:
        query = select(Product).options(
            selectinload(Product.category),
            selectinload(Product.boms).selectinload(BillOfMaterials.items),
        )
        if category_id:
            query = query.where(Product.category_id == category_id)
        if is_active is not None:
            query = query.where(Product.is_active == is_active)
        if search:
            pattern = f"%{search}%"
            query = query.where((Product.name.ilike(pattern)) | (Product.code.ilike(pattern)))

        total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
        query = query.order_by(Product.name.asc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        products = result.scalars().all()
        return list(products), total

    @staticmethod
    async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
        query = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.boms).selectinload(BillOfMaterials.items),
            )
            .where(Product.id == product_id)
        )
        result = await db.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            raise EntityNotFoundError("Product", product_id)
        return product

    @staticmethod
    async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
        existing = await db.scalar(
            select(Product).where(Product.code == data.code.upper().strip())
        )
        if existing:
            raise ConflictError(f"Product with code '{data.code}' already exists.")

        new_product = Product(
            code=data.code.upper().strip(),
            name=data.name.strip(),
            category_id=data.category_id,
            description=data.description,
            unit=data.unit.upper().strip(),
            is_active=data.is_active,
            metadata_json=data.metadata_json or {},
            default_workflow_template_id=data.default_workflow_template_id,
        )
        db.add(new_product)
        await db.commit()
        await db.refresh(new_product)
        return await ProductService.get_product(db, new_product.id)

    @staticmethod
    async def update_product(db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate) -> Product:
        product = await ProductService.get_product(db, product_id)
        if data.name is not None:
            product.name = data.name.strip()
        if data.category_id is not None:
            product.category_id = data.category_id
        if data.description is not None:
            product.description = data.description
        if data.unit is not None:
            product.unit = data.unit.upper().strip()
        if data.is_active is not None:
            product.is_active = data.is_active
        if data.metadata_json is not None:
            product.metadata_json = data.metadata_json
        if data.default_workflow_template_id is not None:
            product.default_workflow_template_id = data.default_workflow_template_id

        await db.commit()
        await db.refresh(product)
        return await ProductService.get_product(db, product.id)

    @staticmethod
    async def add_bom(db: AsyncSession, product_id: uuid.UUID, data: BillOfMaterialsCreate) -> BillOfMaterials:
        product = await ProductService.get_product(db, product_id)

        bom = BillOfMaterials(
            product_id=product.id,
            version=data.version,
            effective_date=data.effective_date,
            is_active=data.is_active,
            notes=data.notes,
        )
        for item in data.items:
            bom_item = BOMItem(
                component_name=item.component_name,
                quantity_per_unit=item.quantity_per_unit,
                unit=item.unit,
                wastage_percentage=item.wastage_percentage,
                is_mandatory=item.is_mandatory,
                notes=item.notes,
            )
            bom.items.append(bom_item)

        db.add(bom)
        await db.commit()
        await db.refresh(bom)
        return bom
