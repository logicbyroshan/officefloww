# 18. Production Engine & Batch Traceability

## Overview
The Production Engine manages physical press machines, operators, production runs, and complete end-to-end traceability from finished goods back to raw material lots and approved artwork files.

---

## 1. The Production File Lock Rule

> **Critical Operational Guard**: Machines must **never** run on unapproved, draft, or pending artwork files.

When creating a `ProductionBatch`:
1. The operator selects the required `FileVersion` ID.
2. The service enforces:
   ```python
   if file_version.approval_state != FileApprovalStatus.APPROVED:
       raise BusinessRuleViolationError(
           "Production file lock violated: Artwork version must be formally APPROVED before starting batch."
       )
   ```
3. If an artwork is revised after approval, the previous file version remains immutable. The new version must be re-approved before any subsequent batches can be created against it.

---

## 2. Batch Numbering Format
Every physical production run generates a deterministic batch identifier:
$$\text{PRINT}-\text{YYYYMMDD}-\text{XXXX}$$
Example: `PRINT-20260902-8F2A`

---

## 3. Real-Time Production Logging
During a shift or run, operators record shift outputs:
- **Good Quantity**: Added to the global `QuantityTransaction` ledger as `PRODUCED`.
- **Reject Quantity**: Added as `REJECTED` with specific defect classification codes.
- **Waste Quantity**: Recorded for sheet setup margins or trimming waste.

When the batch finishes, `completed_at` is set, and the batch status transitions to `COMPLETED`.
