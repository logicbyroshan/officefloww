from celery import Celery
from apps.api.app.core.config import settings

celery_app = Celery(
    "officefloww",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_always_eager=settings.CELERY_TASK_ALWAYS_EAGER,
    task_eager_propagates=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="officefloww.sample_background_task")
def sample_background_task(payload: dict):
    return {"status": "success", "processed_payload": payload}


@celery_app.task(name="officefloww.process_file_checksum")
def process_file_checksum(file_id: str, storage_key: str):
    # Background file hashing / verification job
    return {"file_id": file_id, "status": "verified"}


@celery_app.task(name="officefloww.send_notification_job")
def send_notification_job(user_id: str, title: str, message: str):
    # Background push/email notification job
    return {"user_id": user_id, "sent": True}
