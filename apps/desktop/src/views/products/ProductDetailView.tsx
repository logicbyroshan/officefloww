import React, { useState, useEffect } from "react";
import { Product, BOMItem } from "@officefloww/api-types";
import { ProductsService } from "../../api/services";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Card } from "../../design-system/components/Card";
import { Table, Column } from "../../design-system/components/Table";
import { Badge } from "../../design-system/components/Badge";
import { Button } from "../../design-system/components/Button";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";

export interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onBack,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await ProductsService.get(productId);
      setProduct(p);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  if (loading) return <LoadingState message="Loading product BOM blueprint..." />;
  if (error || !product) return <ErrorState message={error?.message || "Product not found"} onRetry={loadData} />;

  const activeBom = product.boms?.find((b) => b.is_active) || product.boms?.[0];
  const bomItems = activeBom?.items || [];

  const bomColumns: Column<BOMItem>[] = [
    {
      key: "component_name",
      header: "Raw Material Component",
      render: (b) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {b.component_name}
        </span>
      ),
    },
    {
      key: "quantity_per_unit",
      header: "Qty / Unit",
      align: "right",
      width: "120px",
      render: (b) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          {Number(b.quantity_per_unit)} {b.unit}
        </span>
      ),
    },
    {
      key: "wastage_percentage",
      header: "Wastage %",
      align: "right",
      width: "120px",
      render: (b) => (
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--status-warning)" }}>
          +{Number(b.wastage_percentage)}%
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title={product.name}
        subtitle={`Code: ${product.code} • Category: ${product.category?.name || "General Print"} • Unit: ${product.unit}`}
        breadcrumbs={[
          { label: "Product Catalog", onClick: onBack },
          { label: product.name },
        ]}
        badge={<Badge variant="accent">{product.category?.name || "Print Product"}</Badge>}
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={loadData}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Product Specifications */}
          <Card title="Product Blueprint & Specifications">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Description: </span>
                <span style={{ color: "var(--text-primary)" }}>{product.description || "No description provided."}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Production Unit: </span>
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {product.unit}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Active Status: </span>
                <Badge variant={product.is_active ? "success" : "muted"}>
                  {product.is_active ? "Active in Catalog" : "Archived"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Workflow Template */}
          <Card title="Associated DAG Workflow Blueprint">
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Default Workflow ID: </span>
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>
                  {product.default_workflow_template_id || "Standard Production DAG"}
                </strong>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Auto-instantiates sequential & parallel steps (Design, Photography, Press, Ultrasonic Cutting, Dual Verification Packing).
              </div>
            </div>
          </Card>
        </div>

        {/* Bill of Materials Table */}
        <Card
          title="Multi-Component Bill of Materials (BOM)"
          subtitle={`Version: v${activeBom?.version || 1} • Auto-reserves inventory upon order confirmation`}
        >
          <Table
            columns={bomColumns}
            data={bomItems}
            keyExtractor={(b) => b.id}
            emptyText="No BOM components configured for this product."
          />
        </Card>
      </div>
    </div>
  );
};
