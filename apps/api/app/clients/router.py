import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse, PaginatedResponse, PaginationMeta
from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.users.models import User
from apps.api.app.clients.schemas import (
    ClientCreate,
    ClientRead,
    ClientUpdate,
    ClientContactCreate,
    ClientContactRead,
)
from apps.api.app.clients.service import ClientService

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=PaginatedResponse[ClientRead])
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clients:read")),
):
    clients, total = await ClientService.list_clients(
        db=db, page=page, page_size=page_size, search=search, is_active=is_active
    )
    return PaginatedResponse(
        data=[ClientRead.model_validate(c) for c in clients],
        meta=PaginationMeta.create(page=page, page_size=page_size, total=total),
    )


@router.post("", response_model=SuccessResponse[ClientRead])
async def create_client(
    client_in: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clients:write")),
):
    new_client = await ClientService.create_client(db, client_in)
    return SuccessResponse(data=ClientRead.model_validate(new_client))


@router.get("/{client_id}", response_model=SuccessResponse[ClientRead])
async def get_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clients:read")),
):
    client = await ClientService.get_client(db, client_id)
    return SuccessResponse(data=ClientRead.model_validate(client))


@router.patch("/{client_id}", response_model=SuccessResponse[ClientRead])
async def update_client(
    client_id: uuid.UUID,
    client_in: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clients:write")),
):
    updated = await ClientService.update_client(db, client_id, client_in)
    return SuccessResponse(data=ClientRead.model_validate(updated))


@router.post("/{client_id}/contacts", response_model=SuccessResponse[ClientContactRead])
async def add_contact(
    client_id: uuid.UUID,
    contact_in: ClientContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clients:write")),
):
    contact = await ClientService.add_contact(db, client_id, contact_in)
    return SuccessResponse(data=ClientContactRead.model_validate(contact))
