# 15 — Labour & Contractor Operations UX

Third-party and outside contractor labour is critical for peak season manufacturing (e.g. lanyard fitting, card pouching). All contractor operations are managed inside the **Staff** workspace (`StaffView.tsx`):

---

## 1. Material Custody & Reconciliation

When hardware or printed ribbons are issued to contractors:
- **Material Issued**: Raw materials handed over to the contractor unit.
- **Material Held**: Balance currently in the contractor's workshop.
- **Accepted vs. Rejected Output**:
  - Accepted output qualifies for piece-rate payout (e.g. ₹1.50 per lanyard).
  - Rejected items are logged with defect reasons to monitor contractor quality.
- **Material Returned**: Leftover components returned to the main store.

---

## 2. Contractor Ledger & Payouts

The Staff detail drawer displays an instant calculation of:
$$\text{Payout Due} = \text{Accepted Quantity} \times \text{Rate Per Unit} - \text{Defect Penalties}$$
Managers can approve disbursement directly into the `Billing` ledger.
