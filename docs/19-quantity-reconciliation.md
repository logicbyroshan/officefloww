# 19. Quantity Reconciliation & Over-Allocation Prevention

## Overview
Commercial printing requires exact quantity fulfillment. Over-allocating wastes expensive substrates and ribbons; under-allocating leaves orders short and risks client contract penalties.

---

## 1. Mathematical Validation Rules

Given an `OrderItem` with ordered target quantity $Q_{\text{ordered}}$:

$$\sum_{i=1}^{n} Q_{\text{allocated}, i} \le Q_{\text{ordered}}$$

| Condition | Verification Verdict | System Behavior |
| :--- | :--- | :--- |
| $\sum Q_{\text{alloc}} = Q_{\text{ordered}}$ | **Reconciled & Valid** | Batches approved; production runs proceed. |
| $\sum Q_{\text{alloc}} < Q_{\text{ordered}}$ | **Shortfall / Incomplete** | Allowed during phased allocation; flags unallocated deficit $Q_{\text{ordered}} - \sum Q_{\text{alloc}}$. |
| $\sum Q_{\text{alloc}} > Q_{\text{ordered}}$ | **Over-Allocation Violation** | **Strictly Rejected (HTTP 400)**. The attempted batch allocation is aborted before write. |

---

## 2. Practical Factory Floor Example

An order item requires **2,000 ID Cards**:

- **Attempt 1**: Worker 1 allocated 700; Worker 2 allocated 700; Worker 3 allocated 600.
  - $700 + 700 + 600 = 2,000$. **Valid**. Fully reconciled.
- **Attempt 2**: Worker 1 allocated 700; Worker 2 allocated 700; Worker 3 allocated 500.
  - $700 + 700 + 500 = 1,900$. **Under-allocated by 100 units**. Flagged in status dashboard.
- **Attempt 3**: Worker 1 allocated 1,000; Worker 2 allocated 1,000; Worker 3 allocated 500.
  - $1,000 + 1,000 + 500 = 2,500$. **Over-allocated by 500 units**. The 3rd allocation fails with `BusinessRuleViolationError`.

---

## 3. Reconciliation API Endpoint
Managers can query `/production/order-items/{id}/reconciliation` at any time to inspect:
- Target order quantity
- Current total allocated
- Unallocated remaining units
- Over-allocation flags
- Detailed list of batches contributing to the tally
