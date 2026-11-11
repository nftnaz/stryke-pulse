from datetime import datetime

from app.core.database import db
from app.services.options_service import (
    OptionsService,
)


class SnapshotCollector:

    def __init__(self):
        self.options = OptionsService()

    async def collect_nifty_snapshot(self):

        summary = await self.options.get_summary(
            symbol="NIFTY"
        )

        chain = await self.options.get_chain(
            symbol="NIFTY"
        )

        timestamp = datetime.now().isoformat()

        conn = db.get_connection()

        cursor = conn.cursor()

        #
        # Market Snapshot
        #
        cursor.execute(
            """
            INSERT INTO market_snapshots (
                timestamp,
                symbol,
                spot,
                pcr,
                max_pain,
                support,
                resistance
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                timestamp,
                "NIFTY",
                summary.spot,
                summary.pcr,
                summary.max_pain,
                summary.support,
                summary.resistance,
            ),
        )

        #
        # Strike Snapshots
        #
        for strike in chain.strikes:

            cursor.execute(
                """
                INSERT INTO option_snapshots (
                    timestamp,
                    symbol,
                    strike,

                    call_oi,
                    put_oi,

                    call_change_oi,
                    put_change_oi,

                    call_volume,
                    put_volume
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    timestamp,
                    "NIFTY",
                    strike.strike,

                    strike.call_oi,
                    strike.put_oi,

                    strike.call_change_oi,
                    strike.put_change_oi,

                    strike.call_volume,
                    strike.put_volume,
                ),
            )

        conn.commit()
        conn.close()

        print(
            f"Snapshot collected @ {timestamp}"
        )