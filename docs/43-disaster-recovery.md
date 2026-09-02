# 43. Disaster Recovery & Restoration Runbook

## 1. Disaster Recovery Objectives
- **Recovery Point Objective (RPO)**: < 1 Hour (maximum data loss window).
- **Recovery Time Objective (RTO)**: < 15 Minutes (system recovery time).

---

## 2. Step-by-Step Restoration Runbook

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Administrator
    participant Script as Restore Utility
    participant DB as Production Database
    participant API as FastAPI Backend

    Admin->>API: Stop API Service (System Maintenance Mode)
    Admin->>Script: Run python scripts/restore_db.py <backup_filename>
    Script->>DB: Replace database snapshot & verify integrity
    Admin->>API: Run alembic upgrade head
    Admin->>API: Start FastAPI & Celery Services
    Admin->>API: Verify /health and /api/v1/analytics/dashboard
```

### 2.1 Restoring Database Snapshot
```bash
# SQLite Development Restore:
python scripts/restore_db.py officefloww_backup_20260902_150000.db

# PostgreSQL Production Restore:
pg_restore -h localhost -U postgres -d officefloww -v "backups/officefloww_pg_20260902_150000.dump"
```

### 2.2 Re-running Migrations
```bash
alembic upgrade head
```

### 2.3 Health & Integrity Verification
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "OfficeFloww", "version": "3.0.0"}
```
