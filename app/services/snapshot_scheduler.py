from datetime import datetime
from zoneinfo import ZoneInfo

from loguru import logger

from app.services.snapshot_collector import (
    SnapshotCollector,
)

IST = ZoneInfo("Asia/Kolkata")


class SnapshotScheduler:

    def __init__(self):
        self.collector = SnapshotCollector()

    def is_market_open(self) -> bool:

        now = datetime.now(IST)

        #
        # Saturday = 5
        # Sunday = 6
        #
        if now.weekday() >= 5:
            return False

        market_open = (
            now.hour > 9
            or (
                now.hour == 9
                and now.minute >= 15
            )
        )

        market_close = (
            now.hour < 15
            or (
                now.hour == 15
                and now.minute <= 30
            )
        )

        return (
            market_open
            and market_close
        )

    async def run_once(self):

        if not self.is_market_open():

            logger.info(
                "Market closed. Snapshot skipped."
            )

            return

        logger.info(
            "Market open. Running snapshot collection."
        )

        await self.collector.collect_nifty_snapshot()

        logger.info(
            "Snapshot collection completed."
        )