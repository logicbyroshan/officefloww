# 32. Dynamic Delivery ETA Engine

## 1. Overview
The **Delivery ETA Engine** calculates accurate completion dates by evaluating the critical path across all directed acyclic graph (DAG) workflow stages, active machine queues, material procurement lead times, outside contractor fitting capacities, and carrier transit times.

---

## 2. Critical Path Calculation Model

$$\text{Critical Path Hours} = H_{\text{design/proof}} + H_{\text{printing}} + H_{\text{fitting}} + H_{\text{packing}} + H_{\text{dispatch\_buffer}}$$

Where:
- $H_{\text{design/proof}} = 8.0 \text{ hours}$ (artwork verification & client approval buffer)
- $H_{\text{printing}} = \frac{Q_{\text{total}}}{500} \text{ hours}$ (Heidelberg/Epson press throughput rate)
- $H_{\text{fitting}} = \frac{Q_{\text{total}}}{400} \text{ hours}$ (outside labour manual assembly throughput)
- $H_{\text{packing}} = 4.0 \text{ hours}$ (boxing, weighing & QA verification)
- $H_{\text{dispatch\_buffer}} = 12.0 \text{ hours}$ (carrier booking & night bus transit window)

---

## 3. Dynamic Delay Recalculation & History Snapshots
Whenever an operational event impacts delivery timelines:
1. **Client Approval Delayed**: Customer takes 48 hours to approve digital proof.
2. **Machine Maintenance**: Press goes offline for ultrasonic blade replacement.
3. **Labour Shortage**: Contractor reports material bottleneck.

The system dynamically recalculates the projected completion timestamp, classifies confidence level (`HIGH`, `MEDIUM`, `LOW`), and creates an immutable entry in `ETAHistory` capturing the trigger reason and factor breakdown.
