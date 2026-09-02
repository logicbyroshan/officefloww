# 50. Final Business Rules & Invariants Specification

## 1. Core Mathematical & Integrity Invariants

1. **Decimal Financial & Quantity Arithmetic**:
   - All financial amounts, unit rates, tax percentages, and stock quantities MUST use `Decimal` with fixed precision.
   - AI models or floating-point approximations are strictly forbidden from altering financial numbers.

2. **Accepted-Piece Compensation Invariant**:
   - Contractor payments MUST be calculated based on accepted, quality-checked output units:
     $$\text{Payment} = \text{Accepted Units} \times \text{Rate per Unit}$$
   - Issued raw materials must NEVER be used as the compensation multiplier.

3. **Continuous Labour Material Credit Invariant**:
   - When issuing materials to external labour:
     $$\text{Net To Issue} = \max(0, \text{Required Quantity} - \text{Held Material Balance})$$
   - The system automatically credits remaining material to the contractor's ledger for subsequent jobs without requiring manual manager reconciliation.

4. **Production Over-Allocation Invariant**:
   - Total batch allocations across an order item cannot exceed ordered quantity:
     $$\sum \text{Batch Input Quantity} \le \text{Order Item Target Quantity}$$
   - Any attempt to allocate above the target quantity is immediately rejected with HTTP 400 (`BUSINESS_RULE_VIOLATION`).

5. **Approved Artwork Gate Invariant**:
   - Production batches cannot be created without referencing an approved artwork file version (`FileVersion.approval_state == APPROVED`).

6. **Order Completion Preconditions**:
   - An order cannot transition to `COMPLETED` unless:
     1. All workflow steps are `COMPLETED`.
     2. All order items are fully produced, packed, and dispatched.
     3. An invoice has been generated and `Invoice.status == PAID`.
     4. Quantity discrepancies are fully reconciled.

7. **Idempotent Automation Guard**:
   - Duplicate events with identical idempotency keys within 48 hours must produce the cached result without duplicate execution.

8. **AI Safety & Isolation Invariant**:
   - AI assistant tools act exclusively as read-only or staged-action agents. Direct database mutations by LLMs without standard API permission validation are strictly prohibited.
