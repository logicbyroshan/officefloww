import uuid
from decimal import Decimal
from typing import Any, Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.clients.models import Client
from apps.api.app.stock.models import StockItem
from apps.api.app.integrations.schemas import GoogleSheetsImportRequest, GoogleSheetsImportSummary


class GoogleSheetsImporter:
    @staticmethod
    async def import_data(db: AsyncSession, request: GoogleSheetsImportRequest) -> GoogleSheetsImportSummary:
        imported = 0
        skipped = 0
        errors = []

        if request.entity_type == "CLIENTS":
            for row in request.rows:
                code = row.get("client_code") or row.get("code")
                name = row.get("organization_name") or row.get("name")
                if not code or not name:
                    skipped += 1
                    errors.append(f"Row missing required code/name: {row}")
                    continue

                existing = await db.scalar(select(Client).where(Client.client_code == code))
                if existing:
                    skipped += 1
                    continue

                client = Client(
                    client_code=code,
                    organization_name=name,
                    gst_number=row.get("gst_number") or row.get("gst"),
                    billing_address=row.get("billing_address"),
                    delivery_address=row.get("delivery_address"),
                )
                db.add(client)
                imported += 1

        elif request.entity_type == "STOCK_ITEMS":
            for row in request.rows:
                code = row.get("code") or row.get("item_code")
                name = row.get("name") or row.get("item_name")
                if not code or not name:
                    skipped += 1
                    errors.append(f"Row missing code/name: {row}")
                    continue

                existing = await db.scalar(select(StockItem).where(StockItem.code == code))
                if existing:
                    skipped += 1
                    continue

                cost_price = Decimal(str(row.get("cost_price", 10.0)))
                stk = StockItem(
                    code=code,
                    name=name,
                    unit=row.get("unit", "PCS"),
                    cost_price=cost_price,
                    min_stock_level=int(row.get("min_stock_level", 100)),
                )
                db.add(stk)
                imported += 1

        await db.commit()
        return GoogleSheetsImportSummary(
            entity_type=request.entity_type,
            total_rows=len(request.rows),
            imported_count=imported,
            skipped_count=skipped,
            errors=errors,
        )
