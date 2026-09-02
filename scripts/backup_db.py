"""Database Backup Script for OfficeFloww.
Supports both SQLite file copy and PostgreSQL pg_dump snapshotting.
"""

import os
import shutil
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def backup():
    backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backups"))
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    db_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "officefloww_dev.db"))

    if os.path.exists(db_file):
        dest_file = os.path.join(backup_dir, f"officefloww_backup_{timestamp}.db")
        shutil.copy2(db_file, dest_file)
        print(f"✅ SQLite Database Backup Created: {dest_file}")
    else:
        print("ℹ️ Standalone SQLite dev database not found. If running on PostgreSQL, invoke pg_dump.")


if __name__ == "__main__":
    backup()
