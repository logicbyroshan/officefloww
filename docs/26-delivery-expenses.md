# 26. Delivery Expenses, Reimbursements & Exceptions

## Overview
Delivery operations involve daily cash handling and out-of-pocket payments: bus freight charges, rickshaw fares, porter fees, and loading/unloading tips. The system maintains an auditable reimbursement ledger.

---

## 1. Out-of-Pocket Expense Auto-Logging
When a staff member (e.g., Mohan) books a bus parcel and pays ₹800 out-of-pocket:
1. The `book_delivery` endpoint records `charge_amount = 800.00` and `paid_by_id = Mohan.id`.
2. The system automatically creates a `DeliveryExpense` entry:
   - `amount`: ₹800.00
   - `paid_by_id`: Mohan
   - `expense_type`: `BUS_CHARGE`
   - `reimbursement_status`: `PENDING`
   - `receipt_file_id`: Scanned bus ticket / freight slip.

---

## 2. Manager Approval & Cash Settlement
Accounts managers inspect pending delivery reimbursements:
- Status transitions: `PENDING` $\to$ `APPROVED` $\to$ `REIMBURSED`.
- Mohan's expense balance clears, and company petty cash ledger is reconciled.

---

## 3. Delivery Exceptions Protocol

> **Core Philosophy**: Record objective operational facts. Do not prematurely assign emotional blame or fault.

If an operational mismatch occurs (e.g. Order was intended for Indore, but booking clerk accidentally consigned the boxes onto a Bhopal bus):
1. User logs a `DeliveryException`:
   - `expected_value`: `"Destination: Indore (Vijay Nagar)"`
   - `actual_value`: `"Booked: Bhopal Bus Depot"`
   - `reason`: `"Conductor misrouted luggage at boarding platform"`
   - `recorded_by_id`: Employee who discovered the exception
   - `evidence_file_id`: Photo of physical freight ticket showing incorrect city.
2. System flags the delivery as non-standard, alerting logistics managers to initiate parcel rerouting or courier retrieval before the customer is impacted.
