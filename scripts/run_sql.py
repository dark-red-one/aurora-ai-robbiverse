#!/usr/bin/env python3
"""
Run a SQL migration file using the app's async database connection.
Usage: python scripts/run_sql.py /absolute/path/to/file.sql
"""
import sys
import asyncio
from pathlib import Path

# Ensure backend is on sys.path for `app.*` imports
REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.db.database import database  # noqa: E402


def _split_sql_statements(sql_text: str):
    # Simple splitter: suitable for our migration (no functions with embedded ;) 
    # Strips comments and empties
    statements = []
    buffer = []
    in_single_quote = False
    in_double_quote = False

    for ch in sql_text:
        if ch == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
        elif ch == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
        if ch == ";" and not in_single_quote and not in_double_quote:
            stmt = "".join(buffer).strip()
            if stmt:
                statements.append(stmt)
            buffer = []
        else:
            buffer.append(ch)

    tail = "".join(buffer).strip()
    if tail:
        statements.append(tail)

    # Remove single-line comments and empty lines inside each statement
    cleaned = []
    for stmt in statements:
        lines = []
        for line in stmt.splitlines():
            if line.strip().startswith("--"):
                continue
            lines.append(line)
        cs = "\n".join(lines).strip()
        if cs:
            cleaned.append(cs)
    return cleaned


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/run_sql.py /absolute/path/to/file.sql")
        sys.exit(1)

    sql_path = Path(sys.argv[1])
    if not sql_path.exists():
        print(f"SQL file not found: {sql_path}")
        sys.exit(1)

    sql_text = sql_path.read_text()
    statements = _split_sql_statements(sql_text)

    await database.connect()
    try:
        applied = 0
        for stmt in statements:
            await database.execute(stmt)
            applied += 1
        print(f"Applied {applied} statements from {sql_path}")
    finally:
        await database.disconnect()


if __name__ == "__main__":
    asyncio.run(main())










