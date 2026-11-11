"""
Thin async client for Upstox Market Information & Quote APIs.
Focuses on the Analysis endpoints useful for Pulse / Options / OI Flow.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings


class UpstoxClient:
    def __init__(self, access_token: Optional[str] = None):
        settings = get_settings()
        self.v2_base_url = (settings.upstox_v2_base_url.rstrip("/"))
        self.v3_base_url = (settings.upstox_v3_base_url.rstrip("/"))
        
        self.token = access_token or settings.upstox_access_token
        if not self.token:
            logger.warning("UPSTOX_ACCESS_TOKEN is empty – live calls will fail")

        self._headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.token}",
        }

    def _url(self,path: str,) -> str:
        return f"{self.v2_base_url}{path}"

    def _v2_url(self,path: str,):
        return f"{self.v2_base_url}{path}"

    def _v3_url(self,path: str,):
        return f"{self.v3_base_url}{path}"


    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=1, max=8))
    async def _get(self, path: str, params: Optional[dict] = None):
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                self._url(path),
                headers=self._headers,
                params=params
            )

            print("URL:", resp.url)
            print("STATUS:", resp.status_code)
            print("BODY:", resp.text)

            resp.raise_for_status()

            return resp.json()

    async def _get_v3(
        self,
        path: str,
        params: dict | None = None,
    ):
        async with httpx.AsyncClient(
            timeout=30.0
        ) as client:

            resp = await client.get(
                self._v3_url(path),
                headers=self._headers,
                params=params,
            )

            resp.raise_for_status()

            return resp.json()

    # ------------------------------------------------------------------
    # Market Information (Analysis) APIs
    # ------------------------------------------------------------------

    async def get_pcr(
        self,
        instrument_key: str,
        expiry: str,
        trade_date: str,
        bucket_interval: int = 60,
    ) -> dict:
        """
        Put-Call Ratio + intraday insights.
        instrument_key e.g. "NSE_INDEX|Nifty 50"
        expiry & trade_date: YYYY-MM-DD
        """
        params = {
            "instrument_key": instrument_key,
            "expiry": expiry,
            "date": trade_date,
            "bucket_interval": bucket_interval,
        }
        result = await self._get("/market/pcr", params)

        if result.get("data") is None:
            result["data"] = {}

        return result

    async def get_max_pain(
        self,
        instrument_key: str,
        expiry: str,
        trade_date: str,
        bucket_interval: int = 60,
    ) -> dict:
        params = {
            "instrument_key": instrument_key,
            "expiry": expiry,
            "date": trade_date,
            "bucket_interval": bucket_interval,
        }
        result = await self._get("/market/max-pain", params)

        if result.get("data") is None:
            result["data"] = {}

        return result

    async def get_oi(
        self,
        instrument_key: str,
        expiry: str,
        trade_date: str,
    ) -> dict:
        params = {
            "instrument_key": instrument_key,
            "expiry": expiry,
            "date": trade_date,
        }

        result = await self._get("/market/oi", params)

        if not result.get("data"):
            result["data"] = {}

        return result

    async def get_change_in_oi(
        self,
        instrument_key: str,
        expiry: str,
        trade_date: str,
        interval: int = 1,
    ) -> dict:
        params = {
            "instrument_key": instrument_key,
            "expiry": expiry,
            "date": trade_date,
            "interval": interval,
        }

        result = await self._get("/market/change-oi", params)

        if not result.get("data"):
            result["data"] = {}

        return result

    async def get_historical_candles(
        self,
        instrument_key: str,
        unit: str,
        interval: int,
        to_date: str,
        from_date: str,
    ):
        return await self._get_v3(
            f"/historical-candle/{instrument_key}/{unit}/{interval}/{to_date}/{from_date}"
        )


    async def get_fii_data(self, interval: str = "daily") -> dict:
        """interval: daily | monthly"""
        return await self._get("/market/fii", {"interval": interval})

    async def get_dii_data(self, interval: str = "daily") -> dict:
        return await self._get("/market/dii", {"interval": interval})

    # ------------------------------------------------------------------
    # Quotes / instruments helpers
    # ------------------------------------------------------------------

    async def get_market_quote(self, instrument_keys: list[str]) -> dict:
        """Full market quotes (V3 style if available)."""
        # Upstox accepts comma-separated instrument_keys
        keys = ",".join(instrument_keys)
        return await self._get("/market-quote/quotes", {"instrument_key": keys})

    async def get_ltp(self, instrument_keys: list[str]) -> dict:
        keys = ",".join(instrument_keys)
        return await self._get("/market-quote/ltp", {"instrument_key": keys})

    async def get_option_contracts(
        self,
        instrument_key: str,
    ):
        return await self._get(
            "/option/contract",
            {
                "instrument_key": instrument_key
            },
        )

    async def get_option_chain(
        self,
        instrument_key: str,
        expiry_date: str,
    ) -> dict:

        return await self._get(
            "/option/chain",
            {
                "instrument_key": instrument_key,
                "expiry_date": expiry_date,
            },
        )


# Convenience mapping for common indices
INDEX_KEYS = {
    "NIFTY": "NSE_INDEX|Nifty 50",
    "BANKNIFTY": "NSE_INDEX|Nifty Bank",
    "FINNIFTY": "NSE_INDEX|Nifty Fin Service",
    "MIDCPNIFTY": "NSE_INDEX|NIFTY MID SELECT",
    "SENSEX": "BSE_INDEX|SENSEX",
}


def resolve_instrument_key(symbol: str) -> str:
    return INDEX_KEYS.get(symbol.upper(), symbol)
