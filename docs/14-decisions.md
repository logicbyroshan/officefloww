# 14. Architectural Decisions - OfficeFloww

For the primary, authoritative log of all Architectural Decision Records (ADRs), please refer to:
[DECISIONS.md](../DECISIONS.md)

### Summary of Key Decisions:
- **ADR-001**: Modular Monolith Architecture over Microservices.
- **ADR-002**: Asynchronous Database Access with Multi-Dialect Support (PostgreSQL in production, SQLite in test).
- **ADR-003**: Separation of Static Workflow Templates from Runtime Workflow Instances.
- **ADR-004**: DAG-based Step Execution supporting Parallel Workflow Branches and Convergence Gates.
- **ADR-005**: Automatic Task Generation from Workflow Steps with Operational Blockers.
- **ADR-006**: Non-Destructive File Versioning (v1..vn) and Approval State Protection.
- **ADR-007**: Double-Entry Operational Quantity Ledger with Scrap Rate Computation.
- **ADR-008**: Standardized JSON API Response Envelopes (`success`, `data`, `meta`, `error`).
- **ADR-009**: Background Processing via Celery & Redis with Eager Fallback.
