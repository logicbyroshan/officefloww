# 08 — API Integration & Telemetry

PrintFlow connects to the FastAPI core backend through modular service abstractions located in `apps/desktop/src/api/services.ts`.

---

## 1. Primary Service Endpoints

| Service Class | Base URL Path | Primary Functionality |
| :--- | :--- | :--- |
| `OrdersService` | `/orders` | Order creation, 9-stage lifecycle transitions, BOM reservation |
| `TasksService` | `/tasks` | Task dispatch, status completion, blocker reporting |
| `ClientsService` | `/clients` | Client master records, contacts, and credit terms |
| `StockService` | `/stock` | Material inventory, movements, and reservations |
| `PurchasingService`| `/purchasing`| Vendor purchase orders and goods receipt intake |
| `LabourService` | `/labour` | Outside contractor assignments, material returns, payouts |
| `BillingService` | `/billing` | GST invoice generation, client ledger, payment entries |
| `SearchService` | `/search` | Full-text indexed lookup across all business entities |
| `AIService` | `/ai/query` | Natural language voice queries and telemetry questions |

---

## 2. Voice & Natural Language Query

The `VoiceAssistantBar` invokes `POST /api/v1/ai/query`:
```json
{
  "query": "What needs my attention?",
  "context": "dashboard"
}
```
The FastAPI backend dispatches the prompt to `ManagementAIAssistant`, parses shop-floor telemetry, and returns a direct answer with actionable navigation targets.
