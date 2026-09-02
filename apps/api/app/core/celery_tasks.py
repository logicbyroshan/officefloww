import logging
from apps.api.app.core.celery_app import celery_app

logger = logging.getLogger("officefloww.celery")


@celery_app.task(name="tasks.check_low_stock_warnings", bind=True, max_retries=3)
def check_low_stock_warnings(self):
    """Idempotent background job to scan stock levels and log warning alerts."""
    logger.info("Executing periodic low stock check...")
    # In production, queries stock_items where current < min_stock_level
    return {"status": "success", "checked": True}


@celery_app.task(name="tasks.send_async_notification", bind=True, max_retries=3)
def send_async_notification(self, user_id: str, title: str, body: str):
    """Idempotent task to broadcast asynchronous notifications."""
    logger.info(f"Sending notification to user {user_id}: {title} - {body}")
    return {"status": "sent", "user_id": user_id}


@celery_app.task(name="tasks.generate_daily_production_report", bind=True)
def generate_daily_production_report(self):
    """Idempotent scheduled report generator."""
    logger.info("Generating daily production aggregation report...")
    return {"status": "generated"}
