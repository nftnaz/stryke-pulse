from datetime import date
from typing import Any

from app.services.upstox_client import UpstoxClient


class HistoricalService:

    def __init__(self):
        self.client = UpstoxClient()

    async def get_candles(
        self,
        instrument_key: str,
        unit: str = "days",
        interval: int = 1,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict[str, Any]:

        if not to_date:
            to_date = date.today().isoformat()

        if not from_date:
            from_date = "2026-01-01"

        return await self.client.get_historical_candles(
            instrument_key=instrument_key,
            unit=unit,
            interval=interval,
            to_date=to_date,
            from_date=from_date,
        )