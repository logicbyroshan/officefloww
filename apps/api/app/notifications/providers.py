import abc
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("officefloww.notifications")


class NotificationProvider(abc.ABC):
    @abc.abstractmethod
    async def send(self, recipient: str, title: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        pass


class InAppProvider(NotificationProvider):
    async def send(self, recipient: str, title: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        logger.info(f"[InApp Notification] To: {recipient} | {title}: {body}")
        return True


class DesktopProvider(NotificationProvider):
    async def send(self, recipient: str, title: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        logger.info(f"[Desktop WebSocket Alert] To: {recipient} | {title}: {body}")
        return True


class MobilePushProvider(NotificationProvider):
    async def send(self, recipient: str, title: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        logger.info(f"[FCM / APNS Mobile Push] To: {recipient} | {title}: {body}")
        return True


class EmailProvider(NotificationProvider):
    async def send(self, recipient: str, title: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        logger.info(f"[SMTP Email Dispatch] To: {recipient} | Subject: {title} | Body: {body}")
        return True


class WhatsAppProvider(NotificationProvider):
    async def send(self, recipient: str, title: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        # Formatted template structure for WhatsApp Cloud API
        template_name = metadata.get("template_name", "general_alert") if metadata else "general_alert"
        logger.info(f"[WhatsApp Cloud API] Phone: {recipient} | Template: {template_name} | {title}: {body}")
        return True
