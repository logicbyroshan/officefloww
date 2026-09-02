"""Database Restore Utility for OfficeFloww.
Restores a specified backup snapshot.
"""

import os
import shutil
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def restore(backup_filename: str):
    backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backups"))
    source_file = os.path.join(backup_dir, backup_filename)
    target_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "officefloww_dev.db"))

    if not os.path.exists(source_file):
        print(f"❌ Backup file not found: {source_file}")
        sys.exit(1)

    shutil.copy2(source_file, target_file)
    print(f"✅ Database Restored from {backup_filename} to {target_file}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/restore_db.py <backup_filename.db>")
        sys.exit(1)
    restore(sys.argv[1])
