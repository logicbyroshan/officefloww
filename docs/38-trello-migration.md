# 38. Trello Board Migration Bridge

## 1. Migration Overview
For print shops transitioning away from manual Trello boards, the migration bridge ingests exported board JSON, converting cards, lists, members, checklists, and activity comments into structured `Task`, `Workflow`, and `TaskComment` records.

---

## 2. Entity Mapping Matrix

| Trello Object | OfficeFloww Entity | Mapping Rationale |
|:---|:---|:---|
| **Board** | Order / Project | High-level container of operational activity. |
| **List: "Doing / Printing"** | `TaskStatus.IN_PROGRESS` | Active workflow stage. |
| **List: "Done / Completed"** | `TaskStatus.COMPLETED` | Finished workflow stage. |
| **List: "Blocked / On Hold"** | `TaskStatus.BLOCKED` | Awaiting customer data or proof approval. |
| **Card** | `Task` | Operational work package with deadlines and descriptions. |
| **Card Comments** | `TaskComment` | Historical communication log between designers and operators. |
| **Card Attachments** | `FileRecord` | Visual proofs and student spreadsheets. |

---

## 3. Isolation & Decoupling
Trello is **strictly a migration source** and never a runtime dependency of the OfficeFloww production system.
