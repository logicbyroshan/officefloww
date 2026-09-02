import asyncio
import logging
from typing import Callable, Dict, List, Type

from apps.api.app.events.events import DomainEvent

logger = logging.getLogger("officefloww.events")


class EventDispatcher:
    def __init__(self):
        self._handlers: Dict[Type[DomainEvent], List[Callable]] = {}

    def subscribe(self, event_type: Type[DomainEvent], handler: Callable):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def publish(self, event: DomainEvent):
        event_type = type(event)
        logger.info(f"Publishing domain event: {event_type.__name__} [ID: {event.event_id}]")

        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Error handling domain event {event_type.__name__}: {str(e)}", exc_info=True)


# Global singleton dispatcher
dispatcher = EventDispatcher()
