from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parents[2]

DB_PATH = BASE_DIR / "data" / "stryke_pulse.db"


class DatabaseManager:

    def __init__(self):
        self.db_path = DB_PATH

        self.db_path.parent.mkdir(
            exist_ok=True
        )

    def get_connection(self):
        conn = sqlite3.connect(
            self.db_path
        )

        conn.row_factory = sqlite3.Row

        return conn

    def initialize(self):

        conn = self.get_connection()

        cursor = conn.cursor()

        #
        # Market candles
        #
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS market_candles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                symbol TEXT NOT NULL,

                timestamp TEXT NOT NULL,

                open REAL,
                high REAL,
                low REAL,
                close REAL,

                volume REAL,

                open_interest REAL,

                UNIQUE(symbol, timestamp)
            )
            """
        )

        # existing market_candles CREATE stays

        # Soft upgrade: add sector column if missing
        cursor.execute("PRAGMA table_info(market_candles)")
        cols = {row[1] for row in cursor.fetchall()}
        if "sector" not in cols:
            cursor.execute(
                "ALTER TABLE market_candles ADD COLUMN sector TEXT"
            )

        # Optional index for heatmap queries
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_candles_symbol_ts
            ON market_candles (symbol, timestamp)
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_candles_sector_ts
            ON market_candles (sector, timestamp)
            """
        )
        #
        # Market snapshots
        #
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS market_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                timestamp TEXT NOT NULL,

                symbol TEXT NOT NULL,

                spot REAL,

                pcr REAL,

                max_pain REAL,

                support REAL,

                resistance REAL
            )
            """
        )

        #
        # Option snapshots
        #
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS option_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                timestamp TEXT NOT NULL,

                symbol TEXT NOT NULL,

                strike REAL,

                call_oi REAL,
                put_oi REAL,

                call_change_oi REAL,
                put_change_oi REAL,

                call_volume REAL,
                put_volume REAL
            )
            """
        )

        conn.commit()
        conn.close()


db = DatabaseManager()