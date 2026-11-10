from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Pulse
# ---------------------------------------------------------------------------

class IndexSnapshot(BaseModel):
    symbol: str
    ltp: Optional[float] = None
    change: Optional[float] = None
    change_pct: Optional[float] = None
    prev_close: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    timestamp: Optional[datetime] = None


class MarketMood(BaseModel):
    score: int = Field(..., ge=0, le=100, description="0 = extreme risk-off, 100 = extreme risk-on")
    label: str
    breadth_pct: Optional[float] = None
    money_flow_score: Optional[float] = None
    vix: Optional[float] = None
    notes: list[str] = []


class SectorFlow(BaseModel):
    sector: str
    net_flow_cr: Optional[float] = None
    change_pct: Optional[float] = None
    direction: str = "neutral"  # in | out | neutral


class PulseResponse(BaseModel):
    as_of: datetime
    market_status: str  # open | closed | pre | post
    mood: MarketMood
    indices: list[IndexSnapshot]
    india_vix: Optional[float] = None
    sectors: list[SectorFlow] = []
    summary: str = ""
    raw: Optional[dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Options Intelligence
# ---------------------------------------------------------------------------

class OptionWall(BaseModel):
    strike: float
    oi: float
    change_oi: Optional[float] = None
    side: str  # call | put


class StrikeRow(BaseModel):
    strike: float
    call_oi: Optional[float] = None
    call_change_oi: Optional[float] = None
    put_oi: Optional[float] = None
    put_change_oi: Optional[float] = None
    call_volume: Optional[float] = None
    put_volume: Optional[float] = None
    # optional future fields: iv, ltp, etc.


class OptionsSummary(BaseModel):
    symbol: str
    instrument_key: str
    expiry: str
    trade_date: str
    spot: Optional[float] = None
    pcr: Optional[float] = None
    max_pain: Optional[float] = None
    support: Optional[float] = None
    resistance: Optional[float] = None
    call_oi_total: Optional[float] = None
    put_oi_total: Optional[float] = None
    top_call_walls: list[OptionWall] = []
    top_put_walls: list[OptionWall] = []
    insights: list[str] = []
    as_of: datetime
    source: str = "mock"  # mock | upstox


class OptionsChainResponse(BaseModel):
    symbol: str
    instrument_key: str
    expiry: str
    trade_date: str
    spot: Optional[float] = None
    strikes: list[StrikeRow] = []
    as_of: datetime
    source: str = "mock"
