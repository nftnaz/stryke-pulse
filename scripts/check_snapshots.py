import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.core.database import db

conn = db.get_connection()

cursor = conn.cursor()

cursor.execute(
    """
    SELECT COUNT(*)
    FROM market_snapshots
    """
)

market_count = cursor.fetchone()[0]

cursor.execute(
    """
    SELECT COUNT(*)
    FROM option_snapshots
    """
)

option_count = cursor.fetchone()[0]

print(
    f"market_snapshots: {market_count}"
)

print(
    f"option_snapshots: {option_count}"
)

print("\nMost Recent Market Snapshot\n")

cursor.execute(
    """
    SELECT *
    FROM market_snapshots
    ORDER BY id DESC
    LIMIT 1
    """
)

row = cursor.fetchone()

if row:
    print(dict(row))

conn.close()