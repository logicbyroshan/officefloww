# 10. Quantity Ledger - OfficeFloww

## Overview
Traditional ERP systems track a single static integer `quantity = 2500`. In a physical printing factory, this fails to capture real-world variance such as setup waste, print misalignment rejects, ultrasonic cutting scrap, and client partial deliveries.

OfficeFloww implements a double-entry style **Quantity Transaction Ledger**.

---

## Transaction Types

| Transaction Type | Operational Meaning | Impact on Net Good Units |
|---|---|---|
| `ORDERED` | Initial order quantity placed by client. | Baseline Target |
| `PRODUCED` | Raw units produced by machine/press. | + Produced |
| `REJECTED` | Defective units identified during QC/inspection. | - Rejection |
| `WASTED` | Setup/calibration scrap ribbon or sheets. | Factory Loss |
| `ASSIGNED` | Quantity issued to a specific worker/subcontractor. | In Work |
| `COMPLETED` | Finished assembled units ready for packing. | + Finished |
| `DEFECTIVE` | Units damaged during fitting or packing. | - Defect |
| `RETURNED` | Units returned by client for replacement. | - Client Return |
| `PACKED` | Units sorted into boxes with delivery labels. | Packed |
| `DISPATCHED` | Units handed over to client or logistics. | Dispatched |

---

## Derived Metrics & Calculations

### 1. Net Good Units
$$\text{Net Good Units} = \text{PRODUCED} - (\text{REJECTED} + \text{DEFECTIVE})$$

### 2. Scrap Rate Percentage
$$\text{Scrap Rate} (\%) = \frac{\text{REJECTED} + \text{WASTED} + \text{DEFECTIVE}}{\text{PRODUCED} + \text{WASTED}} \times 100$$

### 3. Fulfillment Balance
$$\text{Shortfall} = \text{ORDERED} - \text{Net Good Units}$$

---

## Transaction Ledger API
- `POST /api/v1/quantities/transactions`: Record a batch quantity event with `order_id`, `order_item_id`, `transaction_type`, `quantity`, `batch_reference`, and `reason`.
- `GET /api/v1/quantities/orders/{order_item_id}/summary`: Returns real-time computed balances, scrap rates, and breakdown.
