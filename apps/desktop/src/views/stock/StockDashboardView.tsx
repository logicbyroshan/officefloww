import React, { useState } from "react";
import { StockBalance, StockLocation, StockMovement, StockItem } from "@officefloww/api-types";
import { StockService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Tabs } from "../../design-system/components/Tabs";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { Modal } from "../../design-system/components/Modal";
import { Input, Select, Textarea } from "../../design-system/components/Input";
import { useToast } from "../../design-system/components/Toast";
import { Icon } from "../../design-system/components/Icon";

interface StockRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_level: number;
  cost_price: number;
  location: string;
}

const SEED_STOCK_ITEMS: StockRecord[] = [
  {
    id: "stk-01",
    code: "RAW-PVC-076",
    name: "0.76mm Gloss White PVC Core Sheet (Fused)",
    category: "RAW_MATERIAL",
    unit: "sheets",
    physical_stock: 50000,
    reserved_stock: 2500,
    available_stock: 47500,
    min_stock_level: 10000,
    cost_price: 4.20,
    location: "Main Store - Rack A1",
  },
  {
    id: "stk-02",
    code: "RAW-SATIN-20MM-WHT",
    name: "20mm White Satin Polyester Ribbon Roll",
    category: "RAW_MATERIAL",
    unit: "meters",
    physical_stock: 12000,
    reserved_stock: 2500,
    available_stock: 9500,
    min_stock_level: 3000,
    cost_price: 1.80,
    location: "Main Store - Rack B2",
  },
  {
    id: "stk-03",
    code: "HDW-DOGHOOK-20MM",
    name: "20mm Nickel-Plated Metal Dog-Hook Fitting",
    category: "HARDWARE",
    unit: "pieces",
    physical_stock: 35000,
    reserved_stock: 2500,
    available_stock: 32500,
    min_stock_level: 5000,
    cost_price: 2.10,
    location: "Hardware Bin C3",
  },
  {
    id: "stk-04",
    code: "HDW-SAFETY-BREAK",
    name: "Plastic Quick-Release Safety Breakaway Buckle",
    category: "HARDWARE",
    unit: "pieces",
    physical_stock: 800,
    reserved_stock: 600,
    available_stock: 200,
    min_stock_level: 1500,
    cost_price: 1.50,
    location: "Hardware Bin C4",
  },
  {
    id: "stk-05",
    code: "INK-SUBLIM-CYAN",
    name: "Sublimation Cyan Transfer Ink (1L)",
    category: "CONSUMABLE",
    unit: "bottles",
    physical_stock: 14,
    reserved_stock: 2,
    available_stock: 12,
    min_stock_level: 5,
    cost_price: 650.0,
    location: "Ink Cabinet D1",
  },
];

interface MovementRecord {
  id: string;
  timestamp: string;
  item_code: string;
  movement_type: "ISSUE" | "RETURN" | "WASTE" | "TRANSFER" | "ADJUSTMENT" | "RECEIPT";
  quantity: number;
  from_location: string;
  to_location: string;
  reason: string;
}

const SEED_MOVEMENTS: MovementRecord[] = [
  {
    id: "mov-01",
    timestamp: "2026-09-02T10:30:00Z",
    item_code: "RAW-PVC-076",
    movement_type: "ISSUE",
    quantity: 2500,
    from_location: "Main Store - Rack A1",
    to_location: "Digital Press Floor",
    reason: "Order #ORD-2026-0001 Production Run",
  },
  {
    id: "mov-02",
    timestamp: "2026-09-02T11:15:00Z",
    item_code: "RAW-SATIN-20MM-WHT",
    movement_type: "ISSUE",
    quantity: 2500,
    from_location: "Main Store - Rack B2",
    to_location: "Sublimation Machine 01",
    reason: "Lanyard Sublimation Print Run",
  },
];

export const StockDashboardView: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"balances" | "movements" | "locations" | "low_stock">("balances");
  const [items, setItems] = useState<StockRecord[]>(SEED_STOCK_ITEMS);
  const [movements, setMovements] = useState<MovementRecord[]>(SEED_MOVEMENTS);

  // Movement Modal
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(SEED_STOCK_ITEMS[0].id);
  const [movementType, setMovementType] = useState<MovementRecord["movement_type"]>("ISSUE");
  const [movementQty, setMovementQty] = useState(100);
  const [movementReason, setMovementReason] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPhysical = items.reduce((sum, itm) => sum + itm.physical_stock, 0);
  const totalReserved = items.reduce((sum, itm) => sum + itm.reserved_stock, 0);
  const totalAvailable = items.reduce((sum, itm) => sum + itm.available_stock, 0);
  const lowStockItems = items.filter((itm) => itm.available_stock <= itm.min_stock_level);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const targetItem = items.find((itm) => itm.id === selectedItemId);
      if (!targetItem) return;

      const newMovement: MovementRecord = {
        id: `mov-0${movements.length + 1}`,
        timestamp: new Date().toISOString(),
        item_code: targetItem.code,
        movement_type: movementType,
        quantity: Number(movementQty),
        from_location: targetItem.location,
        to_location: movementType === "ISSUE" ? "Production Floor" : targetItem.location,
        reason: movementReason || `${movementType} logged from desktop workstation`,
      };

      // Update physical and available according to movement
      setItems((prev) =>
        prev.map((itm) => {
          if (itm.id !== selectedItemId) return itm;
          let newPhysical = itm.physical_stock;
          let newReserved = itm.reserved_stock;

          if (movementType === "ISSUE" || movementType === "WASTE") {
            newPhysical = Math.max(0, itm.physical_stock - Number(movementQty));
          } else if (movementType === "RECEIPT" || movementType === "RETURN") {
            newPhysical = itm.physical_stock + Number(movementQty);
          }
          return {
            ...itm,
            physical_stock: newPhysical,
            available_stock: newPhysical - newReserved,
          };
        })
      );

      setMovements((prev) => [newMovement, ...prev]);
      success("Stock Movement Logged", `Recorded ${movementType} of ${movementQty} ${targetItem.unit} for ${targetItem.code}`);
      setIsMovementModalOpen(false);
      setMovementReason("");
    } catch (err: any) {
      toastError("Failed to Record Movement", err.message);
    } finally {
      setLoading(false);
    }
  };

  const balanceColumns: Column<StockRecord>[] = [
    {
      key: "code",
      header: "Stock SKU / Code",
      width: "150px",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {s.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Raw Material / Component Description",
      render: (s) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Location: {s.location} • Cat: {s.category}
          </div>
        </div>
      ),
    },
    {
      key: "physical_stock",
      header: "Physical Stock",
      align: "right",
      width: "130px",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
          {s.physical_stock.toLocaleString()} {s.unit}
        </span>
      ),
    },
    {
      key: "reserved_stock",
      header: "BOM Reserved",
      align: "right",
      width: "130px",
      render: (s) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--status-warning)" }}>
          {s.reserved_stock.toLocaleString()} {s.unit}
        </span>
      ),
    },
    {
      key: "available_stock",
      header: "Net Available",
      align: "right",
      width: "140px",
      render: (s) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: s.available_stock <= s.min_stock_level ? "var(--status-error)" : "var(--status-success)",
          }}
        >
          {s.available_stock.toLocaleString()} {s.unit}
        </span>
      ),
    },
  ];

  const movementColumns: Column<MovementRecord>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      width: "140px",
      render: (m) => (
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {new Date(m.timestamp).toLocaleTimeString()}
        </span>
      ),
    },
    {
      key: "item_code",
      header: "Item SKU",
      width: "160px",
      render: (m) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {m.item_code}
        </span>
      ),
    },
    {
      key: "movement_type",
      header: "Action Type",
      width: "130px",
      render: (m) => {
        let variant: "default" | "accent" | "success" | "warning" | "error" = "default";
        if (m.movement_type === "ISSUE") variant = "accent";
        if (m.movement_type === "RECEIPT") variant = "success";
        if (m.movement_type === "WASTE") variant = "error";
        if (m.movement_type === "RETURN") variant = "warning";
        return <Badge variant={variant}>{m.movement_type}</Badge>;
      },
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      width: "110px",
      render: (m) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          {m.quantity.toLocaleString()}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Movement Reason & Destination",
      render: (m) => (
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {m.reason} <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>({m.to_location})</span>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Stock Balances & Inventory Engine"
        subtitle="Physical vs Reserved vs Available inventory engine with double-entry stock ledger auditing."
        primaryAction={{
          label: "Log Stock Movement",
          icon: "plus",
          onClick: () => setIsMovementModalOpen(true),
        }}
      />

      <div style={{ padding: "16px 24px 0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <StatBox label="Total Physical Stock" value={totalPhysical.toLocaleString()} subValue="Across Warehouse Bins" icon="stock" />
          <StatBox label="Active BOM Reserved" value={totalReserved.toLocaleString()} subValue="Production Holds" icon="lock" status="warning" />
          <StatBox label="Net Available Stock" value={totalAvailable.toLocaleString()} subValue="Available to Promise (ATP)" icon="check-circle" status="success" />
          <StatBox
            label="Low Stock Warnings"
            value={lowStockItems.length}
            subValue="Below Reorder Point"
            icon="alert-triangle"
            status={lowStockItems.length > 0 ? "urgent" : "normal"}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "balances", label: "Stock Items & Balances", icon: "stock", badge: items.length },
          { id: "movements", label: "Movements Ledger", icon: "activity", badge: movements.length },
          { id: "low_stock", label: "Low Stock & Reorders", icon: "alert-triangle", badge: lowStockItems.length },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {/* Core Equation Box */}
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xs)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>
            <strong>Stock Invariant:</strong> Available Stock = Physical Stock − Active BOM Reserved Holds
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-text)" }}>
            5 Locations Monitored
          </span>
        </div>

        {activeTab === "balances" && (
          <Table
            columns={balanceColumns}
            data={items}
            keyExtractor={(s) => s.id}
            emptyText="No stock items configured."
          />
        )}

        {activeTab === "movements" && (
          <Table
            columns={movementColumns}
            data={movements}
            keyExtractor={(m) => m.id}
            emptyText="No stock movements recorded yet."
          />
        )}

        {activeTab === "low_stock" && (
          <Card
            title="Purchase Reorder Recommendations"
            subtitle="Materials where net available stock has fallen below the safety reorder threshold"
          >
            {lowStockItems.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--status-success)" }}>
                <Icon name="check-circle" size={24} />
                <p style={{ marginTop: "6px", fontSize: "12px" }}>All inventory levels are above safety thresholds.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {lowStockItems.map((itm) => (
                  <div
                    key={itm.id}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--status-error-soft)",
                      border: "1px solid var(--status-error-border)",
                      borderRadius: "var(--radius-xs)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--status-error)" }}>{itm.name} ({itm.code})</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Available: <strong>{itm.available_stock} {itm.unit}</strong> • Minimum Safety Point: {itm.min_stock_level} {itm.unit}
                      </div>
                    </div>
                    <Button size="sm" variant="danger" icon="purchasing">
                      Create PO (+{(itm.min_stock_level * 2 - itm.available_stock)} {itm.unit})
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Record Stock Movement"
        subtitle="Issue materials to press machines, log waste, or register supplier receipts"
        width={500}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsMovementModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecordMovement} loading={loading}>
              Record Movement
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordMovement} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Select
            label="Stock Item"
            options={items.map((i) => ({ label: `${i.code} — ${i.name}`, value: i.id }))}
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Select
              label="Movement Type"
              options={[
                { label: "Issue to Floor (ISSUE)", value: "ISSUE" },
                { label: "Supplier Receipt (RECEIPT)", value: "RECEIPT" },
                { label: "Floor Scrap / Waste (WASTE)", value: "WASTE" },
                { label: "Floor Return (RETURN)", value: "RETURN" },
                { label: "Inventory Adjustment (ADJUSTMENT)", value: "ADJUSTMENT" },
              ]}
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as any)}
            />
            <Input
              label="Quantity"
              type="number"
              value={movementQty}
              onChange={(e) => setMovementQty(Number(e.target.value))}
              min={1}
            />
          </div>

          <Textarea
            label="Reason / Job Reference"
            placeholder="e.g. Sublimation heat press ribbon tear, batch replenishment..."
            value={movementReason}
            onChange={(e) => setMovementReason(e.target.value)}
            rows={2}
          />
        </form>
      </Modal>
    </div>
  );
};
