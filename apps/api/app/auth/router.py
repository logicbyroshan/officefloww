from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.app.core.database import get_db
from apps.api.app.core.schemas import SuccessResponse
from apps.api.app.auth.schemas import LoginRequest, TokenResponse, RefreshTokenRequest, LogoutRequest
from apps.api.app.auth.service import AuthService
from apps.api.app.auth.dependencies import get_current_user
from apps.api.app.users.models import User
from apps.api.app.users.schemas import UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=SuccessResponse[TokenResponse])
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    token_response = await AuthService.login(db, data)
    return SuccessResponse(data=token_response)


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    token_response = await AuthService.refresh(db, data.refresh_token)
    return SuccessResponse(data=token_response)


@router.post("/logout", response_model=SuccessResponse[dict])
async def logout(data: LogoutRequest, db: AsyncSession = Depends(get_db)):
    await AuthService.logout(db, data.refresh_token)
    return SuccessResponse(data={"message": "Logged out successfully."})


@router.get("/me", response_model=SuccessResponse[UserRead])
async def get_me(current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=UserRead.model_validate(current_user))
