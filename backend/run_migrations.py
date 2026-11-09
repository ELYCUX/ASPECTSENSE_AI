"""
Migration Runner — Apply SQL migration files to Supabase PostgreSQL.
Run this script once to apply migrations: python run_migrations.py
"""
import os
import sys
import re

# Ensure UTF-8 output encoding on Windows consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.db import execute_query


def run_migration_file(filepath: str):
    """Execute all SQL statements in a migration file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()

    # Split on semicolons
    raw_statements = sql.split(';')

    for raw in raw_statements:
        # Strip comments from each line
        lines = []
        for line in raw.splitlines():
            line_stripped = line.strip()
            if not line_stripped.startswith('--'):
                lines.append(line)
        cleaned = '\n'.join(lines).strip()

        if cleaned:
            try:
                execute_query(cleaned + ';')
                first_line = cleaned.splitlines()[0][:60]
                print(f"  [OK] Executed: {first_line}...")
            except Exception as e:
                print(f"  [ERROR] {e}")


def main():
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    if not os.path.isdir(migrations_dir):
        print(f"No migrations directory found at {migrations_dir}")
        return

    migration_files = sorted([
        f for f in os.listdir(migrations_dir)
        if f.endswith('.sql')
    ])

    print(f"\nRunning {len(migration_files)} migration(s)...")
    for fname in migration_files:
        fpath = os.path.join(migrations_dir, fname)
        print(f"\nFile: {fname}")
        run_migration_file(fpath)

    print("\nMigrations complete!\n")


if __name__ == '__main__':
    main()
