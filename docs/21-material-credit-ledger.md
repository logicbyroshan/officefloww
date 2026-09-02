# 21. Labour Material Credit Ledger

## Overview
In printing operations, hardware fittings (dog hooks, clips, buckles) are often issued in round lots or bulk bags to outside piece-rate workers. When an order finishes, remaining unused material stays in the possession of the worker.

> **Crucial Rule**: Unused material remaining with an outside worker is **company-owned property**. It must not be written off as consumed, nor manually overridden with ad-hoc spreadsheet edits.

---

## 1. The Real-World Scenario
1. **Order 1**: Requires **700 Metal Hooks**.
2. **Issue**: Warehouse issues **1,000 Hooks** (1 bulk bag).
3. **Completion**: Worker finishes **700 units** and returns 0 scrap.
4. **Remaining Balance**: **300 Hooks** remain with the worker.
5. **Order 2**: Requires **1,300 Metal Hooks** from the same worker.
6. **Smart Credit Calculation**:
   - System checks worker's current balance: 300 hooks.
   - Company reuses the 300 credit balance.
   - Warehouse issues only **1,000 new hooks** ($1,300 - 300 = 1,000$).
   - Total hooks in worker's possession now equals exactly 1,300.

---

## 2. Mathematical Ledger Formulation

Labour material balance is derived strictly through the `LabourStockLedger`:

$$\text{Current Balance} = \sum (\text{ISSUED} + \text{TRANSFERRED\_IN}) - \sum (\text{CONSUMED} + \text{DEFECTIVE} + \text{RETURNED} + \text{TRANSFERRED\_OUT})$$

```
+-------------------------------------------------------------------------+
|                       LABOUR STOCK LEDGER                               |
+-----------+--------------+------------------+----------+----------------+
| Date      | Labourer     | Transaction      | Quantity | Running Balance|
+-----------+--------------+------------------+----------+----------------+
| 2026-09-01| Ramesh Kumar | ISSUED           | +1000    | 1000           |
| 2026-09-02| Ramesh Kumar | CONSUMED         | -700     | 300            |
| 2026-09-05| Ramesh Kumar | ISSUED           | +1000    | 1300           |
| 2026-09-06| Ramesh Kumar | CONSUMED         | -1300    | 0              |
+-----------+--------------+------------------+----------+----------------+
```

---

## 3. Inter-Worker Material Transfers
When worker Ramesh holds surplus material and worker Suresh needs urgent stock:
1. Manager initiates a `transfer` request.
2. System logs `TRANSFERRED_OUT` for Ramesh and `TRANSFERRED_IN` for Suresh in an atomic transaction.
3. Central warehouse inventory remains untouched; worker credit ledgers update instantly.
