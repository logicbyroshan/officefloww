from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import require_permission, get_current_user
from apps.api.app.users.models import User
from apps.api.app.integrations.schemas import (
    GoogleSheetsImportRequest,
    GoogleSheetsImportSummary,
    TrelloMigrationRequest,
    TrelloMigrationSummary,
)
from apps.api.app.integrations.google_sheets import GoogleSheetsImporter
from apps.api.app.integrations.trello import TrelloMigrator

router = APIRouter(prefix="/integrations", tags=["Integrations & Migrations"])


@router.post("/google-sheets/import", response_model=SuccessResponse[GoogleSheetsImportSummary])
async def import_from_google_sheets(
    data: GoogleSheetsImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("settings:write")),
):
    summary = await GoogleSheetsImporter.import_data(db, data)
    return SuccessResponse(data=summary)


@router.post("/trello/migrate", response_model=SuccessResponse[TrelloMigrationSummary])
async def migrate_from_trello(
    data: TrelloMigrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("settings:write")),
):
    summary = await TrelloMigrator.migrate_trello_board(db, data, current_user.id)
    return SuccessResponse(data=summary)
