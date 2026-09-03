from typing import Dict, Set
from apps.api.app.users.models import UserRole

ROLE_PERMISSIONS: Dict[UserRole, Set[str]] = {
    UserRole.OWNER: {"*"},
    UserRole.ADMIN: {"*"},
    UserRole.OPERATOR: {
        "orders:read", "orders:write", "orders:approve",
        "workflows:read", "workflows:write", "workflows:advance",
        "tasks:read", "tasks:write", "tasks:complete",
        "files:read", "files:upload",
        "approvals:read", "approvals:write", "approvals:decide",
        "clients:read", "clients:write",
        "products:read", "products:write", "bom:write",
        "ledger:read", "ledger:write",
        "audit:read",
        "users:read",
    },
    UserRole.WORKER: {
        "orders:read",
        "tasks:read", "tasks:complete",
        "files:read",
        "ledger:read", "ledger:write",
    },
    UserRole.MANAGER: {
        "orders:read", "orders:write", "orders:approve",
        "workflows:read", "workflows:write", "workflows:advance",
        "tasks:read", "tasks:write", "tasks:complete",
        "files:read", "files:upload",
        "approvals:read", "approvals:write", "approvals:decide",
        "clients:read", "clients:write",
        "products:read", "products:write", "bom:write",
        "ledger:read", "ledger:write",
        "audit:read",
        "users:read",
    },
    UserRole.SALES: {
        "orders:read", "orders:write",
        "clients:read", "clients:write",
        "products:read",
        "files:read", "files:upload",
        "tasks:read",
        "approvals:read",
    },
    UserRole.DESIGNER: {
        "orders:read",
        "tasks:read", "tasks:complete",
        "files:read", "files:upload",
        "approvals:read", "approvals:write",
        "workflows:read",
    },
    UserRole.DATA_OPERATOR: {
        "orders:read",
        "tasks:read", "tasks:complete",
        "files:read", "files:upload",
        "workflows:read",
    },
    UserRole.PRODUCTION_MANAGER: {
        "orders:read",
        "tasks:read", "tasks:write", "tasks:complete",
        "workflows:read", "workflows:advance",
        "files:read",
        "approvals:read",
        "ledger:read", "ledger:write",
    },
    UserRole.MACHINE_OPERATOR: {
        "tasks:read", "tasks:complete",
        "ledger:read", "ledger:write",
        "files:read",
    },
    UserRole.PACKING_OPERATOR: {
        "tasks:read", "tasks:complete",
        "ledger:read", "ledger:write",
        "orders:read",
    },
    UserRole.ACCOUNTS: {
        "orders:read",
        "clients:read",
        "ledger:read",
        "approvals:read", "approvals:decide",
        "tasks:read", "tasks:complete",
    },
    UserRole.LABOUR: {
        "tasks:read", "tasks:complete",
        "ledger:write",
    },
    UserRole.DELIVERY_PARTNER: {
        "orders:read",
        "tasks:read", "tasks:complete",
    },
    UserRole.DISPATCH_OPERATOR: {
        "orders:read",
        "tasks:read", "tasks:complete",
        "ledger:write",
    },
    UserRole.PURCHASE_MANAGER: {
        "products:read", "bom:read", "bom:write",
        "ledger:read", "ledger:write",
    },
    UserRole.STOCK_MANAGER: {
        "products:read", "bom:read",
        "ledger:read", "ledger:write",
    },
}


def has_permission(role: UserRole, required_permission: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role, set())
    return "*" in perms or required_permission in perms
