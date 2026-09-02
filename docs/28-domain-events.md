# 28. Domain Events & Asynchronous Event Architecture

## Overview
OfficeFloww utilizes domain events to decouple state transitions across stock, production, labour, packing, billing, and notification subsystems.

---

## 1. Domain Event Catalog

| Event Name | Trigger Source | Primary Payload | Asynchronous Handlers |
| :--- | :--- | :--- | :--- |
| `OrderConfirmed` | Sales / Management | `order_id`, `client_id`, `total_amount` | BOM Stock Reservation, Notification broadcast |
| `StockReserved` | Stock Engine | `stock_item_id`, `order_id`, `quantity` | Stock dashboard update |
| `StockShortageDetected` | BOM Calculator | `stock_item_id`, `order_id`, `shortage` | Procurement recommendation generator |
| `ProductionStarted` | Production Floor | `batch_id`, `order_id`, `machine_id` | Machine status toggle (`BUSY`), task advance |
| `ProductionCompleted` | Production Floor | `batch_id`, `good_quantity`, `reject_qty` | Quantity ledger sync, machine status reset |
| `LabourAssigned` | Labour Manager | `labour_batch_id`, `labourer_id`, `qty` | Push notification to worker mobile app |
| `LabourSubmitted` | Worker Mobile | `labour_batch_id`, `completed_qty` | Stock credit deduction, QA inspection queue |
| `PackingCompleted` | Packaging Line | `packing_task_id`, `order_id`, `packed_qty`| Dispatch readiness alert |
| `DispatchBooked` | Logistics Desk | `delivery_id`, `booking_ref`, `charge` | Out-of-pocket expense reimbursement logging |
| `DispatchCompleted` | Carrier / Conductor | `delivery_id`, `order_id` | Customer SMS / WhatsApp delivery notice |
| `InvoiceGenerated` | Accounts | `invoice_id`, `order_id`, `total_amount` | Client ledger debit |
| `PaymentReceived` | Accounts | `payment_id`, `invoice_id`, `amount` | Client ledger credit, invoice status check |

---

## 2. Event Dispatcher & Celery Workers
1. Events inherit from `DomainEvent` with immutable UTC timestamps and unique UUIDs.
2. Handlers subscribe to event types via `EventDispatcher.subscribe()`.
3. CPU-bound or external tasks (SMS gateways, Celery batch aggregation reports, email delivery) are queued idempotently onto Redis-backed Celery workers.
