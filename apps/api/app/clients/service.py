import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import EntityNotFoundError, ConflictError
from apps.api.app.clients.models import Client, ClientContact
from apps.api.app.clients.schemas import ClientCreate, ClientUpdate, ClientContactCreate


class ClientService:
    @staticmethod
    async def list_clients(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[Client], int]:
        query = select(Client).options(selectinload(Client.contacts))
        if is_active is not None:
            query = query.where(Client.is_active == is_active)
        if search:
            pattern = f"%{search}%"
            query = query.where(
                (Client.organization_name.ilike(pattern)) | (Client.client_code.ilike(pattern))
            )

        total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
        query = query.order_by(Client.organization_name.asc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        clients = result.scalars().all()
        return list(clients), total

    @staticmethod
    async def get_client(db: AsyncSession, client_id: uuid.UUID) -> Client:
        query = select(Client).options(selectinload(Client.contacts)).where(Client.id == client_id)
        result = await db.execute(query)
        client = result.scalar_one_or_none()
        if not client:
            raise EntityNotFoundError("Client", client_id)
        return client

    @staticmethod
    async def create_client(db: AsyncSession, data: ClientCreate) -> Client:
        existing = await db.scalar(
            select(Client).where(Client.client_code == data.client_code.upper().strip())
        )
        if existing:
            raise ConflictError(f"Client code '{data.client_code}' is already taken.")

        new_client = Client(
            client_code=data.client_code.upper().strip(),
            organization_name=data.organization_name.strip(),
            is_active=data.is_active,
            notes=data.notes,
            billing_address=data.billing_address,
            delivery_address=data.delivery_address,
            tax_identifier=data.tax_identifier,
        )
        if data.contacts:
            for c in data.contacts:
                contact = ClientContact(
                    name=c.name,
                    phone=c.phone,
                    email=c.email,
                    designation=c.designation,
                    is_primary=c.is_primary,
                    is_active=c.is_active,
                )
                new_client.contacts.append(contact)

        db.add(new_client)
        await db.commit()
        await db.refresh(new_client)
        return new_client

    @staticmethod
    async def update_client(db: AsyncSession, client_id: uuid.UUID, data: ClientUpdate) -> Client:
        client = await ClientService.get_client(db, client_id)
        if data.organization_name is not None:
            client.organization_name = data.organization_name.strip()
        if data.is_active is not None:
            client.is_active = data.is_active
        if data.notes is not None:
            client.notes = data.notes
        if data.billing_address is not None:
            client.billing_address = data.billing_address
        if data.delivery_address is not None:
            client.delivery_address = data.delivery_address
        if data.tax_identifier is not None:
            client.tax_identifier = data.tax_identifier

        await db.commit()
        await db.refresh(client)
        return client

    @staticmethod
    async def add_contact(db: AsyncSession, client_id: uuid.UUID, contact_in: ClientContactCreate) -> ClientContact:
        client = await ClientService.get_client(db, client_id)
        if contact_in.is_primary:
            # Demote existing primary contacts if new one is primary
            for existing_contact in client.contacts:
                if existing_contact.is_primary:
                    existing_contact.is_primary = False

        contact = ClientContact(
            client_id=client.id,
            name=contact_in.name,
            phone=contact_in.phone,
            email=contact_in.email,
            designation=contact_in.designation,
            is_primary=contact_in.is_primary,
            is_active=contact_in.is_active,
        )
        db.add(contact)
        await db.commit()
        await db.refresh(contact)
        return contact
