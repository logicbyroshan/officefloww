# 16. Stock Engine & Lot Traceability

## Overview
OfficeFloww treats raw materials and inventory as a first-class operational domain. Commercial printing requires precise lot-level tracking for substrates (PVC sheets, paper reams, acrylic blanks), ribbons, hardware fittings (dog hooks, breakaway clips), and inks.

---

## 1. Core Distinction: Physical vs. Reserved vs. Available Stock

To prevent stock confusion, over-commitment, and premature consumption, the system enforces a strict separation:

$$\text{Available Stock} = \text{Physical Stock} - \text{Reserved Stock}$$

| Metric | Definition | Trigger |
| :--- | :--- | :--- |
| **Physical Stock** | Material physically present inside company stores/locations. | Increased on Goods Receipt (GRN); Decreased on Issue / Consumption / Scrap. |
| **Reserved Stock** | Material promised to confirmed orders but not yet issued to production floors. | Increased on Order Confirmation BOM reservation; Decreased on Issue or Order Cancellation. |
| **Available Stock** | Net inventory free to be promised to new customer orders. | Dynamically computed; prevents overselling material. |

> **Important Rule**: Reserving material **never** decrements physical stock. Consumption only happens when raw material is physically loaded onto a machine or issued to an assembly line.

---

## 2. Stock Locations
Stock is held across segregated locations:
- `MAIN_STORE`: Central warehouse / bulk storage.
- `PRODUCTION`: Staging area on the press floor.
- `MACHINE`: In-process material loaded directly on a specific machine.
- `IN_HOUSE_WORKER`: Shift buffer for table workers.
- `OUTSIDE_LABOUR`: Company-owned material currently in possession of outside piece-rate contractors.

---

## 3. Stock Movement Ledger
Never overwrite stock balances. Every inventory alteration is recorded as an immutable `StockMovement`:
```python
class StockMovement(Base):
    stock_item_id: uuid.UUID
    lot_id: Optional[uuid.UUID]
    movement_type: StockMovementType # RECEIPT, RESERVATION, ISSUE, CONSUMPTION, RETURN, WASTE, TRANSFER
    quantity: Decimal
    from_location_id: Optional[uuid.UUID]
    to_location_id: Optional[uuid.UUID]
    order_id: Optional[uuid.UUID]
    order_item_id: Optional[uuid.UUID]
    actor_id: Optional[uuid.UUID]
    timestamp: datetime
    reason: str
    metadata_json: dict
```

---

## 4. BOM Calculation & Automatic Reservation Workflow
When an order is confirmed:
1. The system iterates through all active BOM items for each ordered product.
2. Applies the configured **wastage percentage** (e.g., $+3\%$ for printing setup scrap).
3. Compares required quantity against `available_stock`.
4. If available stock is sufficient: creates a `RESERVATION` movement and holds the material.
5. If available stock is insufficient: creates a `RESERVATION` for available units, flags a **Stock Shortage Alert**, and creates a purchase recommendation.
