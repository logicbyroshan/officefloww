# 54. Frontend Developer Integration & Handover Guide

## 1. Handover Overview & Mission

This guide provides everything needed for the frontend developer to connect the desktop Electron and React Native mobile applications to the production OfficeFloww backend.

---

## 2. API Contract & TypeScript Types

The complete TypeScript contract package is located at `packages/api-types/src/index.ts`.

### Installing into Frontend Projects:
```bash
# In your Electron or React Native frontend:
npm install ../../packages/api-types
```

### Example Type Usage:
```typescript
import { ApiResponse, OrderRead, UserRole, StockLotTraceability } from '@officefloww/api-types';

async function fetchOrder(orderId: string): Promise<OrderRead> {
  const res = await fetch(`http://localhost:8000/api/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json: ApiResponse<OrderRead> = await res.json();
  return json.data;
}
```

---

## 3. Public Web Proof Portal Integration

When an artwork file is sent for client approval, the backend returns a public tokenized URL:
- Endpoint: `POST /api/v1/notifications/proofs/{token}/respond`
- Payload:
  ```json
  {
    "action": "APPROVE", // or "REJECT"
    "client_notes": "Colors look perfect, approved for print",
    "signature_text": "John Doe, Principal DPS School"
  }
  ```
- **No authentication header required** (secured via 72h cryptographically signed token).

---

## 4. Mobile / Factory Worker Quick API

Factory floor workers on mobile devices or tablets can use the dedicated streamlined endpoints:
- `GET /api/v1/worker/my-tasks`: Lists only ready/in-progress tasks for the current logged-in worker.
- `POST /api/v1/worker/tasks/{id}/quick-complete`: One-tap completion with optional good/scrap quantity logging.
- `GET /api/v1/worker/scan-barcode?code={box_or_batch_code}`: Instant barcode lookup resolving orders, batches, and packing boxes.
