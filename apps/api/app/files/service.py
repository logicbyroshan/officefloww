import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from apps.api.app.files.models import File, FileVersion, FileFolder, FileLink, FileApprovalStatus


class FileService:
    @staticmethod
    def calculate_checksum(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    async def get_or_create_folder(db: AsyncSession, order_id: uuid.UUID, folder_name: str) -> FileFolder:
        folder = await db.scalar(
            select(FileFolder).where(
                FileFolder.order_id == order_id,
                FileFolder.name == folder_name,
            )
        )
        if not folder:
            folder = FileFolder(
                order_id=order_id,
                name=folder_name,
                path=f"{order_id}/{folder_name}",
            )
            db.add(folder)
            await db.flush()
        return folder

    @staticmethod
    async def upload_file(
        db: AsyncSession,
        filename: str,
        content: bytes,
        mime_type: str,
        order_id: Optional[uuid.UUID] = None,
        order_item_id: Optional[uuid.UUID] = None,
        workflow_step_id: Optional[uuid.UUID] = None,
        task_id: Optional[uuid.UUID] = None,
        folder_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        notes: Optional[str] = None,
    ) -> Tuple[File, FileVersion]:
        checksum = FileService.calculate_checksum(content)
        file_size = len(content)

        # Check if an existing active file exists in this folder / order
        query = select(File).options(selectinload(File.versions)).where(
            File.filename == filename,
            File.order_id == order_id,
            File.is_active == True,
        )
        if folder_id:
            query = query.where(File.folder_id == folder_id)

        result = await db.execute(query)
        existing_file = result.scalar_one_or_none()

        if existing_file:
            # Check if current version is approved; if so, create next version v(n+1)
            new_version_num = existing_file.current_version_number + 1
            storage_key = f"orders/{order_id or 'global'}/{existing_file.id}/v{new_version_num}_{filename}"

            version = FileVersion(
                file_id=existing_file.id,
                version_number=new_version_num,
                storage_key=storage_key,
                checksum=checksum,
                mime_type=mime_type,
                file_size=file_size,
                uploaded_by_id=user_id,
                approval_state=FileApprovalStatus.DRAFT,
                notes=notes or f"Revision v{new_version_num}",
            )
            db.add(version)
            existing_file.current_version_number = new_version_num
            await db.commit()
            await db.refresh(existing_file)
            return existing_file, version
        else:
            # New File record
            file_id = uuid.uuid4()
            storage_key = f"orders/{order_id or 'global'}/{file_id}/v1_{filename}"
            logical_path = f"{order_id or 'general'}/{filename}"

            file_record = File(
                id=file_id,
                folder_id=folder_id,
                order_id=order_id,
                order_item_id=order_item_id,
                workflow_step_id=workflow_step_id,
                task_id=task_id,
                filename=filename,
                logical_path=logical_path,
                current_version_number=1,
                created_by_id=user_id,
            )
            db.add(file_record)
            await db.flush()

            version = FileVersion(
                file_id=file_record.id,
                version_number=1,
                storage_key=storage_key,
                checksum=checksum,
                mime_type=mime_type,
                file_size=file_size,
                uploaded_by_id=user_id,
                approval_state=FileApprovalStatus.DRAFT,
                notes=notes or "Initial version v1",
            )
            db.add(version)

            if order_id:
                db.add(FileLink(file_id=file_record.id, entity_type="ORDER", entity_id=order_id))
            if order_item_id:
                db.add(FileLink(file_id=file_record.id, entity_type="ORDER_ITEM", entity_id=order_item_id))
            if task_id:
                db.add(FileLink(file_id=file_record.id, entity_type="TASK", entity_id=task_id))

            await db.commit()
            await db.refresh(file_record)
            return file_record, version

    @staticmethod
    async def get_file(db: AsyncSession, file_id: uuid.UUID) -> File:
        query = select(File).options(selectinload(File.versions)).where(File.id == file_id)
        result = await db.execute(query)
        file = result.scalar_one_or_none()
        if not file:
            raise EntityNotFoundError("File", file_id)
        return file

    @staticmethod
    async def list_files_by_order(db: AsyncSession, order_id: uuid.UUID) -> List[File]:
        query = (
            select(File)
            .options(selectinload(File.versions), selectinload(File.folder))
            .where(File.order_id == order_id, File.is_active == True)
            .order_by(File.created_at.asc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def list_folders_by_order(db: AsyncSession, order_id: uuid.UUID) -> List[FileFolder]:
        query = (
            select(FileFolder)
            .options(selectinload(FileFolder.files).selectinload(File.versions))
            .where(FileFolder.order_id == order_id)
            .order_by(FileFolder.name.asc())
        )
        result = await db.execute(query)
        return list(result.scalars().all())
