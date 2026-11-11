import sqlite3
from pathlib import Path

DB_PATH = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "stryke_pulse.db"
)

conn = sqlite3.connect(DB_PATH)

cursor = conn.cursor()

cursor.execute(
    """
    SELECT
        symbol,
        COUNT(*)
    FROM market_candles
    GROUP BY symbol
    """
)

for row in cursor.fetchall():
    print(row)

conn.close()