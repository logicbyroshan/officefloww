# 42. Database & Asset Backup Procedures

## 1. Overview
OfficeFloww implements regular automated snapshots for both relational database records (PostgreSQL / SQLite dev) and physical file storage assets (designs, student photos, scans).

---

## 2. Backup Execution Utilities

### 2.1 Automated SQLite Dev Backup
```bash
python scripts/backup_db.py
```
Creates a timestamped snapshot in `backups/officefloww_backup_YYYYMMDD_HHMMSS.db`.

### 2.2 Production PostgreSQL Backup
```bash
pg_dump -h localhost -U postgres -d officefloww -F c -b -v -f "backups/officefloww_pg_$(date +%Y%m%d_%H%M%S).dump"
```

### 2.3 File Storage Backup (MinIO / S3 / Local Disk)
```bash
# S3 / MinIO Sync to Cold Storage
aws s3 sync /var/officefloww/storage/ s3://officefloww-cold-backups/storage/ --delete
```

---

## 3. Backup Retention Policy
- **Daily Backups**: Retained for 30 days.
- **Weekly Snapshots**: Retained for 12 weeks.
- **Monthly Archives**: Retained for 7 years for tax/GST compliance.
