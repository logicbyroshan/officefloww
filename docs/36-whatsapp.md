# 36. WhatsApp Integration Architecture & Client Proof Approval

## 1. Principles & Boundary
- **Not Source of Truth**: WhatsApp is an egress notification and ingress feedback channel only. The internal PostgreSQL database remains the sole source of truth.
- **Pre-Approved Templates**: All outbound business-initiated messages use Meta pre-approved HSM templates.

---

## 2. Supported Event Notification Templates
| Business Event | Template Key | Parameters |
|:---|:---|:---|
| Order Confirmation | `order_received_v1` | `ClientName`, `OrderNumber`, `ItemCount`, `PromisedDate` |
| Design Proof Ready | `proof_ready_v1` | `ClientName`, `OrderNumber`, `ProofSecureURL` |
| Production Started | `production_started_v1` | `OrderNumber`, `MachineName`, `EstimatedHours` |
| Ready for Dispatch | `ready_dispatch_v1` | `OrderNumber`, `PackageCount`, `GrossWeight` |
| Dispatched | `order_dispatched_v1` | `OrderNumber`, `CarrierName`, `TrackingReference` |
| Tax Invoice Sent | `invoice_issued_v1` | `InvoiceNumber`, `TotalAmountINR`, `PaymentDueDate` |
| Payment Received | `payment_receipt_v1` | `ReceiptNumber`, `AmountPaidINR`, `RemainingBalance` |

---

## 3. Secure External Client Proof Approval Portal
Clients do not need internal user accounts to approve artwork proofs:
1. System generates a 128-bit cryptographically secure, time-bound token (`token_urlsafe(32)`).
2. Client accesses `https://client.officefloww.com/proofs/{token}`.
3. Client inspects high-resolution watermarked visual proof.
4. Client selects **Approve** or **Request Changes** with revision notes.
5. On **Approval**: The corresponding `FileVersion` is marked as `APPROVED` and locked against further modification. Production batches can only be instantiated against approved file versions.
