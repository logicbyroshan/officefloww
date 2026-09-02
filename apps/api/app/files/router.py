import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File as FastAPIFile, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.dependencies import get_current_user, require_permission
from apps.api.app.users.models import User
from apps.api.app.files.schemas import FileRead, FileVersionRead, FileFolderRead
from apps.api.app.files.service import FileService

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload", response_model=SuccessResponse[FileRead])
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    order_id: Optional[uuid.UUID] = Form(None),
    order_item_id: Optional[uuid.UUID] = Form(None),
    workflow_step_id: Optional[uuid.UUID] = Form(None),
    task_id: Optional[uuid.UUID] = Form(None),
    folder_id: Optional[uuid.UUID] = Form(None),
    notes: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("files:upload")),
):
    content = await file.read()
    file_record, version = await FileService.upload_file(
        db=db,
        filename=file.filename or "unnamed_file",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
        order_id=order_id,
        order_item_id=order_item_id,
        workflow_step_id=workflow_step_id,
        task_id=task_id,
        folder_id=folder_id,
        user_id=current_user.id,
        notes=notes,
    )
    return SuccessResponse(data=FileRead.model_validate(file_record))


@router.get("/{file_id}", response_model=SuccessResponse[FileRead])
async def get_file(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("files:read")),
):
    file_record = await FileService.get_file(db, file_id)
    return SuccessResponse(data=FileRead.model_validate(file_record))


@router.get("/{file_id}/versions", response_model=SuccessResponse[List[FileVersionRead]])
async def get_file_versions(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("files:read")),
):
    file_record = await FileService.get_file(db, file_id)
    return SuccessResponse(data=[FileVersionRead.model_validate(v) for v in file_record.versions])


@router.get("/order/{order_id}", response_model=SuccessResponse[List[FileRead]])
async def list_order_files(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("files:read")),
):
    files = await FileService.list_files_by_order(db, order_id)
    return SuccessResponse(data=[FileRead.model_validate(f) for f in files])


@router.get("/order/{order_id}/workspace", response_model=SuccessResponse[List[FileFolderRead]])
async def get_order_workspace(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("files:read")),
):
    folders = await FileService.list_folders_by_order(db, order_id)
    return SuccessResponse(data=[FileFolderRead.model_validate(f) for f in folders])
