import React, { useState, useMemo } from "react";
import { Product } from "@officefloww/api-types";
import { PageHeader } from "../../design-system/layouts/PageHeader";
import { Table, Column } from "../../design-system/components/Table";
import { SearchInput } from "../../design-system/components/Input";
import { Button } from "../../design-system/components/Button";
import { Badge } from "../../design-system/components/Badge";
import { LoadingState, ErrorState } from "../../design-system/components/FeedbackStates";

export interface ProductsViewProps {
  products: Product[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelectProduct: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  loading,
  error,
  onRefresh,
  onSelectProduct,
}) => {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [products, search]);

  const columns: Column<Product>[] = [
    {
      key: "code",
      header: "Product Code / SKU",
      width: "160px",
      render: (p) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-text)" }}>
          {p.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Product Title & Specifications",
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
          {p.description && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {p.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "160px",
      render: (p) => <Badge variant="accent">{p.category?.name || "General Print"}</Badge>,
    },
    {
      key: "unit",
      header: "Stock Unit",
      width: "110px",
      render: (p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{p.unit}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      width: "100px",
      render: (p) => (
        <Badge variant={p.is_active ? "success" : "muted"} dot>
          {p.is_active ? "Active" : "Archived"}
        </Badge>
      ),
    },
  ];

  if (loading && products.length === 0) {
    return <LoadingState message="Loading product catalog..." />;
  }

  if (error && products.length === 0) {
    return <ErrorState message={error.message} onRetry={onRefresh} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      <PageHeader
        title="Product Catalog & Bill of Materials"
        subtitle="Configured commercial print products, wastage markup percentages, and workflow blueprints."
        secondaryActions={
          <Button variant="secondary" icon="refresh" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div style={{ width: "320px" }}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by product name or code..."
          />
        </div>

        <Table
          columns={columns}
          data={filteredProducts}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => onSelectProduct(p.id)}
          emptyText="No products found in the active catalog."
        />
      </div>
    </div>
  );
};
