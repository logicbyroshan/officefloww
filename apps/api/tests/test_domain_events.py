import pytest
from decimal import Decimal
import uuid
from apps.api.app.events.dispatcher import dispatcher
from apps.api.app.events.events import (
    OrderConfirmed,
    StockReserved,
    StockShortageDetected,
    ProductionStarted,
    LabourAssigned,
    DispatchBooked,
    PaymentReceived,
)


@pytest.mark.asyncio
async def test_domain_event_publish_and_subscribe():
    events_received = []

    async def handle_order_confirmed(event: OrderConfirmed):
        events_received.append(event)

    async def handle_stock_reserved(event: StockReserved):
        events_received.append(event)

    dispatcher.subscribe(OrderConfirmed, handle_order_confirmed)
    dispatcher.subscribe(StockReserved, handle_stock_reserved)

    # Publish events
    order_id = uuid.uuid4()
    await dispatcher.publish(OrderConfirmed(order_id=order_id, total_amount=Decimal("50000.0")))
    await dispatcher.publish(StockReserved(order_id=order_id, reserved_quantity=Decimal("1000.0")))

    assert len(events_received) == 2
    assert isinstance(events_received[0], OrderConfirmed)
    assert events_received[0].order_id == order_id
    assert isinstance(events_received[1], StockReserved)
    assert events_received[1].reserved_quantity == Decimal("1000.0")
