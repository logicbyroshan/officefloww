# 20. Labour Management & Piece-Rate Contractors

## Overview
OfficeFloww provides dedicated support for both **in-house floor operators** and **outside piece-rate labour** (e.g. specialized workers who handle manual lanyard fitting, badge pin attachment, heat transfers, and envelope packing).

---

## 1. Labourer Profiles & Skill Sets
Each worker profile stores:
- **Identification**: Code (`LAB-RAMESH`), Name, Primary Phone, WhatsApp contact.
- **Labour Type**: `IN_HOUSE_WORKER` vs. `OUTSIDE_CONTRACT`.
- **Skills Matrix**: Operation skills (`MPL_FITTING`, `BADGE_PINNING`, `CARD_PUNCHING`) with proficiency ratings (1-5).
- **Availability & Capacity**: Current workload, daily maximum unit throughput preferences, and leave schedules.

---

## 2. Multi-Worker Batch Allocations
When a large order (e.g., 5,000 Lanyards) arrives, managers split manual assembly across multiple workers:
1. Manager creates `LabourBatch` allocations specifying `allocated_quantity` and `due_date`.
2. Over-allocation validation guarantees the sum of labour batches never exceeds the order item quantity.
3. Workers receive task notifications on their mobile interface with piece count instructions.

---

## 3. Worker Performance Metrics
OfficeFloww tracks:
- **Productivity Score**: Completed units per target day.
- **Quality Score**: Percentage of accepted vs. defective units:
  $$\text{Quality Score} = \left(\frac{\text{Accepted Units}}{\text{Accepted Units} + \text{Defective Units}}\right) \times 100$$
- **On-Time Fulfillment Rate**: Ratio of batches delivered by promised due date.
