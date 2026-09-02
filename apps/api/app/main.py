from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.app.core.config import settings
from apps.api.app.core.database import Base, engine
from apps.api.app.core.logging import setup_logging
from apps.api.app.core.middleware import CorrelationIdMiddleware, register_exception_handlers
from apps.api.app.core.ws_router import router as ws_router

from apps.api.app.auth.router import router as auth_router
from apps.api.app.users.router import router as users_router
from apps.api.app.clients.router import router as clients_router
from apps.api.app.products.router import router as products_router
from apps.api.app.orders.router import router as orders_router
from apps.api.app.workflows.router import router as workflows_router
from apps.api.app.tasks.router import router as tasks_router
from apps.api.app.files.router import router as files_router
from apps.api.app.approvals.router import router as approvals_router
from apps.api.app.quantities.router import router as quantities_router
from apps.api.app.audit.router import router as audit_router

# Phase 2 Routers
from apps.api.app.stock.router import router as stock_router
from apps.api.app.purchasing.router import router as purchasing_router
from apps.api.app.production.router import router as production_router
from apps.api.app.labour.router import router as labour_router
from apps.api.app.assets.router import router as assets_router
from apps.api.app.packing.router import router as packing_router
from apps.api.app.dispatch.router import router as dispatch_router
from apps.api.app.billing.router import router as billing_router
from apps.api.app.worker.router import router as worker_router

# Phase 3 Routers
from apps.api.app.quotations.router import router as quotations_router
from apps.api.app.capacity.router import router as capacity_router
from apps.api.app.eta.router import router as eta_router
from apps.api.app.automation.router import router as automation_router
from apps.api.app.notifications.router import router as notifications_router
from apps.api.app.integrations.router import router as integrations_router
from apps.api.app.ai.router import router as ai_router
from apps.api.app.analytics.router import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured logger
    setup_logging()
    # Create tables if sqlite or dev
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="OfficeFloww API",
    description="Centralized Production Management and Office Automation System for Commercial Printing Operations.",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Correlation ID and exception handlers
app.add_middleware(CorrelationIdMiddleware)
register_exception_handlers(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "3.0.0",
    }


# Include Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(users_router, prefix=api_v1)
app.include_router(clients_router, prefix=api_v1)
app.include_router(products_router, prefix=api_v1)
app.include_router(orders_router, prefix=api_v1)
app.include_router(workflows_router, prefix=api_v1)
app.include_router(tasks_router, prefix=api_v1)
app.include_router(files_router, prefix=api_v1)
app.include_router(approvals_router, prefix=api_v1)
app.include_router(quantities_router, prefix=api_v1)
app.include_router(audit_router, prefix=api_v1)

# Phase 2 Routers
app.include_router(stock_router, prefix=api_v1)
app.include_router(purchasing_router, prefix=api_v1)
app.include_router(production_router, prefix=api_v1)
app.include_router(labour_router, prefix=api_v1)
app.include_router(assets_router, prefix=api_v1)
app.include_router(packing_router, prefix=api_v1)
app.include_router(dispatch_router, prefix=api_v1)
app.include_router(billing_router, prefix=api_v1)
app.include_router(worker_router, prefix=api_v1)

# Phase 3 Routers
app.include_router(quotations_router, prefix=api_v1)
app.include_router(capacity_router, prefix=api_v1)
app.include_router(eta_router, prefix=api_v1)
app.include_router(automation_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)
app.include_router(integrations_router, prefix=api_v1)
app.include_router(ai_router, prefix=api_v1)
app.include_router(analytics_router, prefix=api_v1)

# WebSocket Router
app.include_router(ws_router)
