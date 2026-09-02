import asyncio
import os
import sys
import uuid
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from apps.api.app.core.database import Base, get_db
from apps.api.app.core.security import get_password_hash, create_access_token
from apps.api.app.main import app
from apps.api.app.users.models import User, UserRole

# Use an isolated in-memory or dedicated SQLite database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestAsyncSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session: AsyncSession) -> User:
    user = User(
        email="admin_test@officefloww.com",
        hashed_password=get_password_hash("TestPass@123"),
        full_name="Admin Tester",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def admin_token(admin_user: User) -> str:
    return create_access_token(str(admin_user.id), admin_user.role.value)


@pytest_asyncio.fixture(scope="function")
async def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture(scope="function")
async def operator_user(db_session: AsyncSession) -> User:
    user = User(
        email="operator_test@officefloww.com",
        hashed_password=get_password_hash("TestPass@123"),
        full_name="Machine Operator Tester",
        role=UserRole.MACHINE_OPERATOR,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def operator_token(operator_user: User) -> str:
    return create_access_token(str(operator_user.id), operator_user.role.value)


@pytest_asyncio.fixture(scope="function")
async def operator_headers(operator_token: str) -> dict:
    return {"Authorization": f"Bearer {operator_token}"}
