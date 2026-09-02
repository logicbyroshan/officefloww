# 08. File Management & Logical Workspaces - OfficeFloww

## Overview
A critical problem in printing facilities is that employees store customer rosters, photos, and high-resolution artwork on local PCs, leading to lost files, version conflicts, and unapproved versions mistakenly going to press.

OfficeFloww treats **Files as a First-Class Business Module**. Files are stored in S3-compatible object storage (MinIO for local development, AWS S3/Cloudflare R2 for production), while metadata, checksums, and versions are managed in PostgreSQL.

---

## Logical Order Workspace
Whenever an order is confirmed, the system initializes a structured logical workspace:

```
ORD-2026-0001/
├── 01-Order/         # Purchase orders, contracts, quotations
├── 02-Data/          # Student/employee raw excel sheets, CSV rosters
├── 03-Photography/   # High-resolution original portrait photography
├── 04-Design/        # CorelDraw/InDesign artwork, proof layouts
├── 05-Approved/      # Client-approved and locked production proofs
├── 06-Printing/      # Imposition files, RIP print-ready files
├── 07-Fitting/       # Assembly instructions, packaging spec
├── 08-Packing/       # Packing slips, division breakdown lists
├── 09-Dispatch/      # Signed delivery challans, courier slips
└── 10-Billing/       # GST Tax Invoices, e-way bills
```

Logical relationships are stored in the database (`file_folders` and `files`), ensuring files remain fully searchable and linkable even if storage backends change.

---

## Non-Destructive File Versioning
- **Never Silently Overwrite**: If a designer uploads an updated file with the same filename (e.g. `student_id_proof.pdf`), the system retains the original as `v1` and creates `v2`.
- **Integrity**: Every upload computes a **SHA-256** checksum stored in `FileVersion.checksum`.
- **Approval State**: Each version tracks `approval_state`: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`.
- **Production Lock**: Once `v2` is approved, it is locked. Any subsequent edit requires uploading `v3` and undergoing a new review cycle.
