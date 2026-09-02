import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from apps.api.app.core.config import settings
from apps.api.app.core.database import Base

# Import all models to register them with Base.metadata
import apps.api.app.users.models
import apps.api.app.clients.models
import apps.api.app.products.models
import apps.api.app.orders.models
import apps.api.app.workflows.models
import apps.api.app.tasks.models
import apps.api.app.files.models
import apps.api.app.approvals.models
import apps.api.app.quantities.models
import apps.api.app.audit.models
import apps.api.app.notifications.models
import apps.api.app.automation.models
import apps.api.app.settings.models
import apps.api.app.stock.models
import apps.api.app.purchasing.models
import apps.api.app.production.models
import apps.api.app.labour.models
import apps.api.app.assets.models
import apps.api.app.packing.models
import apps.api.app.dispatch.models
import apps.api.app.billing.models
import apps.api.app.quotations.models
import apps.api.app.capacity.models
import apps.api.app.eta.models

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
