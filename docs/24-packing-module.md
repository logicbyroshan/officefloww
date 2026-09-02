# 24. Packing & Quality Verification

## Overview
Packing is the final quality checkpoint before physical dispatch. Defective or miscounted shipments directly impact customer satisfaction.

---

## 1. Packing Tasks & Containers
Each `OrderItem` spawns a `PackingTask` with target quantity $Q_{\text{target}}$.
Packing operators assemble finished units into containers:
- `BOX`: Standard corrugated shipping box (e.g., 500 ID cards per box).
- `BUNDLE`: Tied ribbon packet (e.g., 50 lanyards per bundle).
- `CARTON`: Master shipping carton.
- `PALLET`: Wooden pallet for bulk national orders.
- `ENVELOPE`: Padded bubble mailer for document marksheets.

---

## 2. Strict Over-Packing Prevention
When packing boxes:
$$\sum_{j=1}^{m} \text{Package Quantity}_j \le Q_{\text{target}}$$
If an operator accidentally attempts to pack units beyond the target quantity, the system immediately returns an over-allocation rejection (HTTP 400).

---

## 3. Four-Eyes Verification Protocol
- **Packer**: Shop floor worker who counts and seals packages.
- **Verifier**: Quality inspector who weighs boxes on digital scales, checks barcode serials against the packing slip, and signs off the `PackingRecord`.
- Once verified, the order item's `QuantityTransaction` records the units as `PACKED`, advancing the order toward completion readiness.
