# 37. Google Sheets Bulk Data Import Bridge

## 1. Overview
The **Google Sheets Import Bridge** enables commercial printing companies migrating from legacy spreadsheets to bulk-import master catalogs and historical records into the authoritative OfficeFloww database.

---

## 2. Supported Entities & Column Mappings

### 2.1 Clients Import
- `client_code` (Unique uppercase string, e.g. `CLI-DPS-01`)
- `organization_name` (Company / School name)
- `gst_number` (15-character Indian GSTIN)
- `billing_address` / `delivery_address`

### 2.2 Stock Items & Pricing Import
- `code` (Unique SKU, e.g. `RAW-HOOK-DOG`)
- `name` (Item description)
- `unit` (`PCS`, `METERS`, `ROLLS`, `PACKS`)
- `cost_price` (Base procurement cost)
- `min_stock_level` (Reorder threshold)

---

## 3. Ingestion Pipeline & Validation
1. **Schema Parsing**: Validates required fields, decimal conversions, and uppercase formatting.
2. **Deduplication**: Skips existing client codes and SKU codes without overwriting active production data.
3. **Summary Reporting**: Returns JSON summary with `imported_count`, `skipped_count`, and detailed validation error messages.
