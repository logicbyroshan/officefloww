# 25. Dispatch & Logistics Infrastructure

## Overview
Commercial printing requires versatile dispatch methods: inter-state night buses for same-day delivery, national couriers (DTDC, Blue Dart), intra-city mini-trucks (Porter), or personal customer pick-up.

---

## 1. Transport Providers & Methods
OfficeFloww natively models 5 transport categories:
- `BUS`: Private sleeper/cargo bus services (e.g., Hans Travels, Royal Travels). Common for overnight regional delivery between cities.
- `DTDC`: Air/surface express parcel couriers with tracking docket numbers.
- `PORTER`: On-demand intra-city two-wheeler and three-wheeler tempo deliveries.
- `COURIER`: Regional door-to-door courier services.
- `OTHER`: Direct factory pickup by client's representative.

---

## 2. Dispatch Workflow
1. **Delivery Slip Creation**: Shipping manager creates `Delivery` record linking to order, destination address, number of boxes, and gross weight.
2. **Booking Entry**: Delivery boy or booking clerk takes parcels to bus depot or courier office.
3. **Docket Number Registration**: Clerk enters LR / Docket number (e.g. `BUS-LR-987654`) into `DeliveryBooking`.
4. **Status Transitions**:
   $$\text{DRAFT} \longrightarrow \text{BOOKED} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{DELIVERED}$$
5. Client receives automatic notification with bus operator name, conductor phone number, and LR booking receipt.
