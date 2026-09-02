# 22. Piece-Rate Labour Payments & Acceptance Integrity

## Overview
OfficeFloww automates piece-rate compensation for manual operations, guaranteeing financial integrity between operational output and accounting payouts.

---

## 1. Configurable Piece Rates
Piece rates are defined per product and operation:
- `MPL_FITTING`: ₹0.80 per lanyard piece.
- `BADGE_PINNING`: ₹0.40 per acrylic badge.
- `CARD_PUNCHING`: ₹0.35 per slot hole.

Rates carry `effective_date` timestamps, ensuring historic batches preserve their original contract price even if baseline rates are updated in the future.

---

## 2. The Acceptance Calculation Invariant

> **Strict Rule**: Labour payouts are **strictly computed from accepted good units**, **never** from issued material quantities.

$$\text{Payable Amount} = Q_{\text{accepted}} \times \text{Rate Per Unit}$$

### Scenario Example:
- **Material Issued**: 1,000 raw lanyard pieces.
- **Worker Submitted**: 700 finished pieces (0 defectives).
- **Correct Payable**: $700 \times \text{₹}0.80 = \text{₹}560.00$.
- **Invalid Calculation**: $1,000 \times \text{₹}0.80 = \text{₹}800.00$ (**System strictly forbids this**).

---

## 3. Payment Generation & Accounting Records
1. Manager clicks `Generate Payment` for a labourer.
2. System aggregates all unbilled `LabourSubmission` records.
3. Sums `accepted_quantity` $\times$ `rate_per_unit`.
4. Creates a `LabourPayment` record with unique reference (e.g., `PAY-LB-20260902-8F12`).
5. Marks the associated batches as billed, preventing duplicate payouts.
