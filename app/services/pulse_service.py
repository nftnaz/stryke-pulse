"""
Aggregates data into the high-level Pulse view.
Falls back to sensible mock data when Upstox token is missing (for local UI work).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from loguru import logger

from app.core.config import get_settings
from app.models.schemas import (
    IndexSnapshot,
    MarketMood,
    PulseResponse,
    SectorFlow,
)
from app.services.upstox_client import UpstoxClient, resolve_instrument_key

IST = ZoneInfo("Asia/Kolkata")


def _now_ist() -> datetime:
    return datetime.now(IST)


def _is_market_hours(now: Optional[datetime] = None) -> bool:
    now = now or _now_ist()
    if now.weekday() >= 5:
        return False
    open_t = now.replace(hour=9, minute=15, second=0, microsecond=0)
    close_t = now.replace(hour=15, minute=30, second=0, microsecond=0)
    return open_t <= now <= close_t


class PulseService:
    def __init__(self, client: Optional[UpstoxClient] = None):
        self.client = client or UpstoxClient()
        self.settings = get_settings()

    async def get_pulse(self) -> PulseResponse:
        now = _now_ist()
        status = "open" if _is_market_hours(now) else "closed"

        # Try live data; fall back to mock so UI still works
        try:
            if self.client.token:
                return await self._live_pulse(now, status)
        except Exception as e:
            logger.warning(f"Live pulse failed, using mock: {e}")

        return self._mock_pulse(now, status)

    async def _live_pulse(self, now, status):
        keys = [
            resolve_instrument_key("NIFTY"),
            resolve_instrument_key("BANKNIFTY"),
        ]

        quotes = await self.client.get_market_quote(keys)

        data = quotes.get("data", {})

        nifty = data.get("NSE_INDEX:Nifty 50", {})
        banknifty = data.get("NSE_INDEX:Nifty Bank", {})

        indices = []

        if nifty:
            indices.append(
                IndexSnapshot(
                    symbol="NIFTY",
                    ltp=nifty.get("last_price", 0),
                    change=nifty.get("net_change", 0),
                    change_pct=(
                        nifty.get("net_change", 0)
                        / max(nifty.get("ohlc", {}).get("close", 1), 1)
                    ) * 100,
                    prev_close=nifty.get("ohlc", {}).get("close", 0),
                    high=nifty.get("ohlc", {}).get("high", 0),
                    low=nifty.get("ohlc", {}).get("low", 0),
                    timestamp=now,
                )
            )

        if banknifty:
            indices.append(
                IndexSnapshot(
                    symbol="BANKNIFTY",
                    ltp=banknifty.get("last_price", 0),
                    change=banknifty.get("net_change", 0),
                    change_pct=(
                        banknifty.get("net_change", 0)
                        / max(banknifty.get("ohlc", {}).get("close", 1), 1)
                    ) * 100,
                    prev_close=banknifty.get("ohlc", {}).get("close", 0),
                    high=banknifty.get("ohlc", {}).get("high", 0),
                    low=banknifty.get("ohlc", {}).get("low", 0),
                    timestamp=now,
                )
            )

        mood = MarketMood(
            score=65,
            label="Constructive",
            breadth_pct=50,
            money_flow_score=0.5,
            vix=15,
            notes=["Live data enabled"],
        )

        return PulseResponse(
            as_of=now,
            market_status=status,
            mood=mood,
            indices=indices,
            india_vix=15,
            sectors=[],
            summary=f"NIFTY {indices[0].ltp if indices else 0}",
        )

    def _mock_pulse(self, now: datetime, status: str) -> PulseResponse:
        """Realistic placeholder so frontend can be developed immediately."""
        mood = MarketMood(
            score=62,
            label="Constructive",
            breadth_pct=46.5,
            money_flow_score=0.35,
            vix=14.8,
            notes=[
                "Breadth mixed (advancers slightly behind)",
                "Money rotating into Banks & Pharma",
                "India VIX in normal zone",
            ],
        )

        indices = [
            IndexSnapshot(
                symbol="NIFTY",
                ltp=25045.0,
                change=14.3,
                change_pct=0.06,
                prev_close=25030.7,
                high=25120.0,
                low=24980.0,
                timestamp=now,
            ),
            IndexSnapshot(
                symbol="BANKNIFTY",
                ltp=59741.0,
                change=655.0,
                change_pct=1.11,
                prev_close=59086.0,
                high=59850.0,
                low=59200.0,
                timestamp=now,
            ),
            IndexSnapshot(
                symbol="FINNIFTY",
                ltp=23850.0,
                change=85.0,
                change_pct=0.36,
                prev_close=23765.0,
                timestamp=now,
            ),
        ]

        sectors = [
            SectorFlow(sector="Bank", net_flow_cr=7051, change_pct=1.3, direction="in"),
            SectorFlow(sector="Pharma", net_flow_cr=5935, change_pct=2.1, direction="in"),
            SectorFlow(sector="PSU Bank", net_flow_cr=4407, change_pct=3.2, direction="in"),
            SectorFlow(sector="Auto", net_flow_cr=2157, change_pct=0.8, direction="in"),
            SectorFlow(sector="IT", net_flow_cr=-1272, change_pct=-0.9, direction="out"),
            SectorFlow(sector="Cap Goods", net_flow_cr=-1049, change_pct=-1.1, direction="out"),
        ]

        summary = (
            f"Constructive tape: breadth mixed, money into Bank & Pharma, "
            f"out of IT & Cap goods; NIFTY {indices[0].change_pct:+.2f}%"
        )

        return PulseResponse(
            as_of=now,
            market_status=status,
            mood=mood,
            indices=indices,
            india_vix=14.8,
            sectors=sectors,
            summary=summary,
        )
