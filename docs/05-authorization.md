# 05. Authorization & RBAC - OfficeFloww

## Overview
Permissions in OfficeFloww are strictly enforced **server-side** via FastAPI dependencies. The frontend must never be trusted as the source of truth for authorization decisions.

---

## Role Definitions
The printing facility operates with 10 Phase 1 roles, with 5 future roles already provisioned in the architecture:

| Role | Operational Scope |
|---|---|
| `OWNER` | Full enterprise control, financials, audit oversight, settings. |
| `ADMIN` | System configuration, user provisioning, global access. |
| `MANAGER` | Production oversight, approving proofs, order management. |
| `SALES` | Client onboarding, quotation, order creation. |
| `DESIGNER` | Artwork merging, variable data layout (VDP), file uploads. |
| `DATA_OPERATOR` | Student/employee roster entry, photo cropping, data validation. |
| `PRODUCTION_MANAGER`| Shop-floor scheduling, machine allocation, order dispatches. |
| `MACHINE_OPERATOR` | Printing, thermal transfers, ultrasonic cutting, defect reporting. |
| `PACKING_OPERATOR` | Insertion into card holders, lanyard clipping, division boxing. |
| `ACCOUNTS` | Billing, delivery challans, payment settlement. |

### Future Provisioned Roles
- `LABOUR`: Outside/in-house piece-rate workers.
- `DELIVERY_PARTNER`: Delivery boys and logistics couriers.
- `DISPATCH_OPERATOR`: Logistics receiving and dispatch bay workers.
- `PURCHASE_MANAGER`: Raw material procurement from suppliers.
- `STOCK_MANAGER`: Raw material warehouse and physical inventory audits.

---

## Role-Permission Matrix

| Permission | OWNER / ADMIN | MANAGER | SALES | DESIGNER | DATA_OPERATOR | PROD_MGR | MACHINE_OP | PACKING_OP | ACCOUNTS |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `orders:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `orders:write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `orders:approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `workflows:read` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `workflows:write`| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `workflows:advance`|✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `tasks:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tasks:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `tasks:complete` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `files:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `files:upload` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `approvals:write`| ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `approvals:decide`|✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `clients:read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `clients:write`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products:read`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `products:write`|✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `bom:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ledger:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `ledger:write` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| `audit:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `users:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## FastAPI Enforcement Mechanism
Routes use the dependency `require_permission(perm: str)`:
```python
@router.post("", response_model=SuccessResponse[OrderRead])
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("orders:write")),
):
    ...
```
If the token bearer's role does not possess the required permission, a `PermissionDeniedError` (HTTP 403) is raised before any route code executes.
