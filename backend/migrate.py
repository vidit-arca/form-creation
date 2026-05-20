"""
Migration Script: Adds new Project/Hospital tables and columns to existing forms.db
- Creates 'projects' and 'hospitals' tables
- Adds nullable columns to 'forms' and 'submissions' tables
- Creates a default 'General' project for existing orphaned data
- Safe to run multiple times (idempotent checks)
"""
import sqlite3
import sys
from datetime import datetime, timezone

DB_PATH = "./forms.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("🔄 Starting migration...")

    # ── Step 1: Create 'projects' table ──
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            created_by INTEGER REFERENCES users(id),
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✅ 'projects' table ready")

    # ── Step 2: Create 'hospitals' table ──
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hospitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            site_code TEXT UNIQUE NOT NULL,
            project_id INTEGER REFERENCES projects(id),
            address TEXT,
            contact_info TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✅ 'hospitals' table ready")

    # ── Step 3: Add nullable columns to 'forms' (if not already present) ──
    existing_form_cols = {row[1] for row in cursor.execute("PRAGMA table_info(forms)").fetchall()}
    if "project_id" not in existing_form_cols:
        cursor.execute("ALTER TABLE forms ADD COLUMN project_id INTEGER REFERENCES projects(id)")
        print("  ✅ Added 'project_id' to forms")
    else:
        print("  ⏭️  'project_id' already exists on forms")

    # ── Step 4: Add nullable columns to 'submissions' (if not already present) ──
    existing_sub_cols = {row[1] for row in cursor.execute("PRAGMA table_info(submissions)").fetchall()}

    new_sub_cols = {
        "project_id": "INTEGER REFERENCES projects(id)",
        "hospital_id": "INTEGER REFERENCES hospitals(id)",
        "center_id": "TEXT",
        "submitted_by": "TEXT"
    }
    for col_name, col_type in new_sub_cols.items():
        if col_name not in existing_sub_cols:
            cursor.execute(f"ALTER TABLE submissions ADD COLUMN {col_name} {col_type}")
            print(f"  ✅ Added '{col_name}' to submissions")
        else:
            print(f"  ⏭️  '{col_name}' already exists on submissions")

    # ── Step 5: Create default project for orphaned data ──
    cursor.execute("SELECT id FROM projects WHERE slug = 'GEN_DEFAULT'")
    default_project = cursor.fetchone()

    if not default_project:
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            "INSERT INTO projects (name, slug, description, is_active, created_at) VALUES (?, ?, ?, ?, ?)",
            ("General (Default)", "GEN_DEFAULT", "Default project for pre-migration forms", 1, now)
        )
        default_id = cursor.lastrowid
        print(f"  ✅ Created default project 'GEN_DEFAULT' (id={default_id})")
    else:
        default_id = default_project[0]
        print(f"  ⏭️  Default project already exists (id={default_id})")

    # ── Step 6: Assign orphaned forms to default project ──
    cursor.execute("UPDATE forms SET project_id = ? WHERE project_id IS NULL", (default_id,))
    orphaned_forms = cursor.rowcount
    print(f"  ✅ Assigned {orphaned_forms} orphaned form(s) to default project")

    # ── Step 7: Assign orphaned submissions to default project ──
    cursor.execute("UPDATE submissions SET project_id = ? WHERE project_id IS NULL", (default_id,))
    orphaned_subs = cursor.rowcount
    print(f"  ✅ Assigned {orphaned_subs} orphaned submission(s) to default project")

    conn.commit()
    conn.close()

    print("\n🎉 Migration complete!")
    print(f"   Tables created: projects, hospitals")
    print(f"   Forms migrated: {orphaned_forms}")
    print(f"   Submissions migrated: {orphaned_subs}")

if __name__ == "__main__":
    migrate()
