import React, { useState } from "react";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card, StatBox } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";

interface MockStockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  unit: string;
  reorder_threshold: number;
}

const INITIAL_STOCK_ITEMS: MockStockItem[] = [
  {
    id: "stk-01",
    sku: "RAW-PVC-WHITE-076",
    name: "White PVC Card Core Sheet (0.76mm)",
    category: "RAW_MATERIAL",
    physical_stock: 50000,
    reserved_stock: 2500,
    available_stock: 47500,
    unit: "sheets",
    reorder_threshold: 10000,
  },
  {
    id: "stk-02",
    sku: "RAW-SATIN-20MM-WHT",
    name: "20mm White Satin Polyester Ribbon Roll",
    category: "RAW_MATERIAL",
    physical_stock: 12000,
    reserved_stock: 2500,
    available_stock: 9500,
    unit: "meters",
    reorder_threshold: 3000,
  },
  {
    id: "stk-03",
    sku: "HDW-DOGHOOK-20MM",
    name: "20mm Metal Dog-Hook Fitting (Nickel Plated)",
    category: "HARDWARE",
    physical_stock: 35000,
    reserved_stock: 2500,
    available_stock: 32500,
    unit: "pieces",
    reorder_threshold: 5000,
  },
  {
    id: "stk-04",
    sku: "INK-SUBLIM-CYAN-1L",
    name: "Sublimation Printing Cyan Ink (1 Liter Bottle)",
    category: "CONSUMABLE",
    physical_stock: 15,
    reserved_stock: 2,
    available_stock: 13,
    unit: "bottles",
    reorder_threshold: 5,
  },
  {
    id: "stk-05",
    sku: "RAW-ACRYLIC-2MM-CLR",
    name: "2mm Clear Cast Acrylic Sheet (4ft x 3ft)",
    category: "RAW_MATERIAL",
    physical_stock: 120,
    reserved_stock: 10,
    available_stock: 110,
    unit: "sheets",
    reorder_threshold: 25,
  },
];

export const StockView: React.FC = () => {
  const [stockItems] = useState<MockStockItem[]>(INITIAL_STOCK_ITEMS);

  const columns: Column<MockStockItem>[] = [
    {
      key: "name",
      header: "Raw Material / Component Description",
      render: (s) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Category: {s.category}</div>
        </div>
      ),
    },
    {
      key: "physical_stock",
      header: "Physical In Stock",
      align: "right",
      width: "140px",
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
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--status-success)" }}>
          {s.available_stock.toLocaleString()} {s.unit}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Stock Balances & Inventory Engine"
        subtitle="Physical vs Reserved vs Available separation with automatic BOM reservation on order confirmation."
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <StatBox label="Total Tracked Materials" value={stockItems.length} subValue="Tracked Items" icon="stock" />
          <StatBox label="Physical Inventory Units" value="97,135" subValue="Across Locations" icon="package" />
          <StatBox label="BOM Reserved Holds" value="7,512" subValue="Active Production Holds" icon="lock" />
          <StatBox label="Net Available Units" value="89,623" subValue="Available to Promise" icon="check-circle" status="success" />
        </div>

        <Card
          title="Warehouse Stock Items"
          subtitle="Equation enforced: Available Stock = Physical Stock - Reserved Stock"
        >
          <Table
            columns={columns}
            data={stockItems}
            keyExtractor={(s) => s.id}
            emptyText="No stock items found."
          />
        </Card>
      </div>
    </div>
  );
};
