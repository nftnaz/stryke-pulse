"""
Options Intelligence Engine – Phase 1

Fetches / normalizes:
- PCR
- Max Pain
- Open Interest (totals + strike-wise)
- Change in OI
- Top call / put walls
- Simple textual insights

Falls back to realistic mock data when no Upstox token is present
so the UI and charts can be developed immediately.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional
from zoneinfo import ZoneInfo

from loguru import logger

from app.core.config import get_settings
from app.models.schemas import (
    OptionWall,
    OptionsChainResponse,
    OptionsSummary,
    StrikeRow,
)
from app.services.upstox_client import UpstoxClient, resolve_instrument_key

IST = ZoneInfo("Asia/Kolkata")


def _now_ist() -> datetime:
    return datetime.now(IST)


def _today_str() -> str:
    return _now_ist().strftime("%Y-%m-%d")


def _nearest_thursday(from_date: Optional[datetime] = None) -> str:
    """Rough nearest weekly expiry (Thursday) for mock / fallback."""
    d = (from_date or _now_ist()).date()
    # 0=Mon ... 3=Thu
    days_ahead = (3 - d.weekday()) % 7
    if days_ahead == 0 and (from_date or _now_ist()).hour >= 15:
        days_ahead = 7
    expiry = d + timedelta(days=days_ahead)
    return expiry.strftime("%Y-%m-%d")


class OptionsService:
    def __init__(self, client: Optional[UpstoxClient] = None):
        self.client = client or UpstoxClient()
        self.settings = get_settings()

    async def get_summary(
        self,
        symbol: str = "NIFTY",
        expiry: Optional[str] = None,
        trade_date: Optional[str] = None,
    ) -> OptionsSummary:
        symbol = symbol.upper()
        instrument_key = resolve_instrument_key(symbol)
        trade_date = trade_date or _today_str()
        if not expiry:
            expiry = await self._resolve_expiry(
                instrument_key
            )

        try:
            if self.client.token:
                return await self._live_summary(symbol, instrument_key, expiry, trade_date)
        except Exception as e:
            logger.warning(f"Live options summary failed ({symbol}): {e}")

        return self._mock_summary(symbol, instrument_key, expiry, trade_date)

    async def get_chain(
        self,
        symbol: str = "NIFTY",
        expiry: Optional[str] = None,
        trade_date: Optional[str] = None,
    ) -> OptionsChainResponse:
        symbol = symbol.upper()
        instrument_key = resolve_instrument_key(symbol)
        trade_date = trade_date or _today_str()
        if not expiry:
            expiry = await self._resolve_expiry(
                instrument_key
            )

        try:
            if self.client.token:
                return await self._live_chain(symbol, instrument_key, expiry, trade_date)
        except Exception as e:
            logger.warning(f"Live options chain failed ({symbol}): {e}")

        return self._mock_chain(symbol, instrument_key, expiry, trade_date)

    # ------------------------------------------------------------------
    # Live paths (Upstox Analysis APIs)
    # ------------------------------------------------------------------

    async def _live_summary(
        self,
        symbol: str,
        instrument_key: str,
        expiry: str,
        trade_date: str,
    ) -> OptionsSummary:

        chain = await self.client.get_option_chain(
            instrument_key=instrument_key,
            expiry_date=expiry,
        )

        option_chain = chain.get("data") or []

        if not option_chain:
            raise ValueError(
                "No option chain data returned"
            )

        call_walls = []
        put_walls = []

        total_call_oi = 0
        total_put_oi = 0

        spot = None

        for row in option_chain:

            strike = float(
                row.get("strike_price", 0)
            )

            spot = (
                row.get("underlying_spot_price")
                or spot
            )

            call_oi = (
                row.get("call_options", {})
                .get("market_data", {})
                .get("oi")
                or 0
            )

            put_oi = (
                row.get("put_options", {})
                .get("market_data", {})
                .get("oi")
                or 0
            )

            total_call_oi += call_oi
            total_put_oi += put_oi

            call_walls.append(
                OptionWall(
                    strike=strike,
                    oi=float(call_oi),
                    side="call",
                )
            )

            put_walls.append(
                OptionWall(
                    strike=strike,
                    oi=float(put_oi),
                    side="put",
                )
            )

        #
        # Sort walls
        #
        call_walls.sort(
            key=lambda x: x.oi,
            reverse=True
        )

        put_walls.sort(
            key=lambda x: x.oi,
            reverse=True
        )

        #
        # Real PCR
        #
        pcr = (
            total_put_oi / total_call_oi
            if total_call_oi > 0
            else None
        )

        #
        # P2 Max Pain
        #
        max_pain = None

        try:

            max_pain_data = (
                await self.client.get_max_pain(
                    instrument_key,
                    expiry,
                    trade_date,
                )
            )

            data = (
                max_pain_data.get("data")
                or {}
            )

            max_pain = (
                data.get("max_pain")
                or data.get("maxPain")
                or data.get("max_pain_strike")
            )

        except Exception as e:
            logger.warning(
                f"Unable to load Max Pain: {e}"
            )

        #
        # P3 Support/Resistance
        #
        support = (
            put_walls[0].strike
            if put_walls
            else None
        )

        resistance = (
            call_walls[0].strike
            if call_walls
            else None
        )

        insights = []

        if pcr:

            if pcr > 1.2:
                insights.append(
                    f"PCR {pcr:.2f} bullish"
                )

            elif pcr < 0.8:
                insights.append(
                    f"PCR {pcr:.2f} bearish"
                )

            else:
                insights.append(
                    f"PCR {pcr:.2f} neutral"
                )

        if support:
            insights.append(
                f"Strong support near {support:.0f}"
            )

        if resistance:
            insights.append(
                f"Strong resistance near {resistance:.0f}"
            )

        if max_pain:
            insights.append(
                f"Max pain {float(max_pain):.0f}"
            )

        summary = OptionsSummary(
            symbol=symbol,
            instrument_key=instrument_key,
            expiry=expiry,
            trade_date=trade_date,
            spot=spot,
            pcr=pcr,
            max_pain=max_pain,
            call_oi_total=total_call_oi,
            put_oi_total=total_put_oi,
            top_call_walls=call_walls[:5],
            top_put_walls=put_walls[:5],
            insights=insights,
            as_of=_now_ist(),
            source="upstox",
        )

        #
        # Temporary attributes until schema updated
        #
        setattr(summary, "support", support)
        setattr(summary, "resistance", resistance)

        return summary

    async def _live_chain(
        self,
        symbol: str,
        instrument_key: str,
        expiry: str,
        trade_date: str,
    ) -> OptionsChainResponse:

        chain = await self.client.get_option_chain(
            instrument_key=instrument_key,
            expiry_date=expiry,
        )

        option_chain = chain.get("data") or []

        change_map = {}

        try:
            change_oi_data = await self.client.get_change_in_oi(
                instrument_key,
                expiry,
                trade_date,
            )

            change_rows = (
                change_oi_data.get("data", {})
                .get("call_put_oi_data_list", [])
            )

            for row in change_rows:

                strike = float(
                    row.get("strike_price", 0)
                )

                change_map[strike] = {
                    "call_change_oi": row.get(
                        "call_change_oi"
                    ),
                    "put_change_oi": row.get(
                        "put_change_oi"
                    ),
                }

            logger.info(
                f"Change OI rows received: {len(change_map)}"
            )

        except Exception as e:
            logger.warning(
                f"Unable to load Change OI data: {e}"
            )

        strikes: list[StrikeRow] = []

        spot = None

        for row in option_chain:

            spot = (
                row.get("underlying_spot_price")
                or spot
            )

            strike = float(
                row.get("strike_price", 0)
            )

            change_data = change_map.get(
                strike,
                {}
            )

            strikes.append(
                StrikeRow(
                    strike=strike,

                    call_oi=_f(
                        row.get("call_options", {})
                        .get("market_data", {})
                        .get("oi")
                    ),

                    put_oi=_f(
                        row.get("put_options", {})
                        .get("market_data", {})
                        .get("oi")
                    ),

                    call_change_oi=_f(
                        change_data.get(
                            "call_change_oi"
                        )
                    ),

                    put_change_oi=_f(
                        change_data.get(
                            "put_change_oi"
                        )
                    ),

                    call_volume=_f(
                        row.get("call_options", {})
                        .get("market_data", {})
                        .get("volume")
                    ),

                    put_volume=_f(
                        row.get("put_options", {})
                        .get("market_data", {})
                        .get("volume")
                    ),
                )
            )

        strikes.sort(
            key=lambda x: x.strike
        )

        #
        # P0 ATM filtering
        #
        if spot:
            strikes = [
                s
                for s in strikes
                if abs(s.strike - spot) <= 1000
            ]

        logger.info(
            f"Returning {len(strikes)} strike rows"
        )

        return OptionsChainResponse(
            symbol=symbol,
            instrument_key=instrument_key,
            expiry=expiry,
            trade_date=trade_date,
            spot=spot,
            strikes=strikes,
            as_of=_now_ist(),
            source="upstox",
        )

    async def _resolve_expiry(
        self,
        instrument_key: str,
    ) -> str:

        contracts = await self.client.get_option_contracts(
            instrument_key
        )

        data = contracts.get("data") or []

        expiries = sorted(
            {
                row.get("expiry")
                for row in data
                if row.get("expiry")
            }
        )

        if not expiries:
            raise ValueError(
                f"No expiries found for {instrument_key}"
            )

        return expiries[0]

    # ------------------------------------------------------------------
    # Parsing helpers (defensive – Upstox response shapes can vary)
    # ------------------------------------------------------------------

    def _extract_pcr(self, data: dict) -> Optional[float]:
        try:
            d = data.get("data") or data
            val = d.get("pcr")
            return float(val) if val is not None else None
        except Exception:
            return None

    def _extract_max_pain(self, data: dict) -> Optional[float]:
        try:
            d = data.get("data") or data
            # common keys: max_pain, maxPain, strike
            for key in ("max_pain", "maxPain", "max_pain_strike", "strike"):
                if key in d and d[key] is not None:
                    return float(d[key])
            # sometimes nested
            insights = d.get("insights") or []
            if insights and isinstance(insights, list):
                last = insights[-1]
                if isinstance(last, dict) and "max_pain" in last:
                    return float(last["max_pain"])
            return None
        except Exception:
            return None

    def _extract_spot(self, data: dict) -> Optional[float]:
        try:
            d = data.get("data") or data
            for key in ("spot_closing_price", "spot_price", "spot", "underlying_value"):
                if key in d and d[key] is not None:
                    return float(d[key])
            return None
        except Exception:
            return None

    def _parse_oi_walls(
        self, oi_data: dict, coi_data: dict
    ) -> tuple[Optional[float], Optional[float], list[OptionWall], list[OptionWall]]:
        """
        Returns (call_oi_total, put_oi_total, call_walls, put_walls)
        Walls are sorted by OI descending.
        """
        call_walls: list[OptionWall] = []
        put_walls: list[OptionWall] = []
        call_total = put_total = None

        try:
            oi = (oi_data.get("data") or oi_data)
            # Try common shapes
            strikes = (
                oi.get("strikes")
                or oi.get("data")
                or oi.get("oi_data")
                or []
            )

            # Change-in-OI lookup
            coi_map: dict[float, dict] = {}
            try:
                coi = (coi_data.get("data") or coi_data)
                coi_strikes = coi.get("strikes") or coi.get("data") or []
                for row in coi_strikes:
                    if not isinstance(row, dict):
                        continue
                    s = float(row.get("strike") or row.get("strike_price") or 0)
                    coi_map[s] = row
            except Exception:
                pass

            for row in strikes:
                if not isinstance(row, dict):
                    continue
                strike = float(row.get("strike") or row.get("strike_price") or 0)
                call_oi = row.get("call_oi") or row.get("ce_oi") or row.get("callOpenInterest")
                put_oi = row.get("put_oi") or row.get("pe_oi") or row.get("putOpenInterest")

                coi_row = coi_map.get(strike, {})
                call_chg = coi_row.get("call_oi_change") or coi_row.get("ce_oi_change")
                put_chg = coi_row.get("put_oi_change") or coi_row.get("pe_oi_change")

                if call_oi is not None:
                    call_walls.append(
                        OptionWall(
                            strike=strike,
                            oi=float(call_oi),
                            change_oi=float(call_chg) if call_chg is not None else None,
                            side="call",
                        )
                    )
                if put_oi is not None:
                    put_walls.append(
                        OptionWall(
                            strike=strike,
                            oi=float(put_oi),
                            change_oi=float(put_chg) if put_chg is not None else None,
                            side="put",
                        )
                    )

            call_walls.sort(key=lambda w: w.oi, reverse=True)
            put_walls.sort(key=lambda w: w.oi, reverse=True)

            call_total = sum(w.oi for w in call_walls) or None
            put_total = sum(w.oi for w in put_walls) or None

            # Also try aggregate totals if present
            if oi.get("call_oi") is not None:
                call_total = float(oi["call_oi"])
            if oi.get("put_oi") is not None:
                put_total = float(oi["put_oi"])

        except Exception as e:
            logger.warning(f"OI wall parsing issue: {e}")

        return call_total, put_total, call_walls, put_walls

    def _parse_strike_rows(
        self, oi_data: dict, coi_data: dict
    ) -> list[StrikeRow]:
        rows: list[StrikeRow] = []
        try:
            oi = (oi_data.get("data") or oi_data)
            strikes = oi.get("strikes") or oi.get("data") or []

            coi_map: dict[float, dict] = {}
            try:
                coi = (coi_data.get("data") or coi_data)
                for row in (coi.get("strikes") or coi.get("data") or []):
                    if isinstance(row, dict):
                        s = float(row.get("strike") or row.get("strike_price") or 0)
                        coi_map[s] = row
            except Exception:
                pass

            for row in strikes:
                if not isinstance(row, dict):
                    continue
                strike = float(row.get("strike") or row.get("strike_price") or 0)
                coi_row = coi_map.get(strike, {})
                rows.append(
                    StrikeRow(
                        strike=strike,
                        call_oi=_f(row.get("call_oi") or row.get("ce_oi")),
                        put_oi=_f(row.get("put_oi") or row.get("pe_oi")),
                        call_change_oi=_f(coi_row.get("call_oi_change") or coi_row.get("ce_oi_change")),
                        put_change_oi=_f(coi_row.get("put_oi_change") or coi_row.get("pe_oi_change")),
                        call_volume=_f(row.get("call_volume") or row.get("ce_volume")),
                        put_volume=_f(row.get("put_volume") or row.get("pe_volume")),
                    )
                )
            rows.sort(key=lambda r: r.strike)
        except Exception as e:
            logger.warning(f"Strike row parsing issue: {e}")
        return rows

    def _build_insights(
        self,
        symbol: str,
        pcr: Optional[float],
        max_pain: Optional[float],
        spot: Optional[float],
        call_walls: list[OptionWall],
        put_walls: list[OptionWall],
    ) -> list[str]:
        insights: list[str] = []

        if pcr is not None:
            if pcr > 1.2:
                insights.append(f"PCR {pcr:.2f} – put-heavy positioning (supportive bias)")
            elif pcr < 0.8:
                insights.append(f"PCR {pcr:.2f} – call-heavy positioning (resistance bias)")
            else:
                insights.append(f"PCR {pcr:.2f} – balanced")

        if max_pain is not None and spot is not None:
            diff_pct = (max_pain - spot) / spot * 100
            insights.append(
                f"Max pain {max_pain:.0f} is {diff_pct:+.2f}% from spot {spot:.0f}"
            )

        if call_walls:
            top = call_walls[0]
            insights.append(f"Heaviest call OI wall at {top.strike:.0f} (OI {top.oi:,.0f})")
        if put_walls:
            top = put_walls[0]
            insights.append(f"Heaviest put OI wall at {top.strike:.0f} (OI {top.oi:,.0f})")

        if not insights:
            insights.append("Awaiting richer data from Upstox Analysis APIs")

        return insights

    # ------------------------------------------------------------------
    # Mock data (realistic for NIFTY / BANKNIFTY so UI can be built)
    # ------------------------------------------------------------------

    def _mock_summary(
        self,
        symbol: str,
        instrument_key: str,
        expiry: str,
        trade_date: str,
    ) -> OptionsSummary:
        if symbol == "BANKNIFTY":
            spot = 59740.0
            pcr = 0.92
            max_pain = 59500.0
            call_walls = [
                OptionWall(strike=60000, oi=185000, change_oi=22000, side="call"),
                OptionWall(strike=60500, oi=142000, change_oi=15000, side="call"),
                OptionWall(strike=61000, oi=98000, change_oi=8000, side="call"),
            ]
            put_walls = [
                OptionWall(strike=59000, oi=210000, change_oi=31000, side="put"),
                OptionWall(strike=58500, oi=156000, change_oi=18000, side="put"),
                OptionWall(strike=58000, oi=112000, change_oi=9000, side="put"),
            ]
            call_total = 620000.0
            put_total = 570000.0
        else:  # NIFTY default
            spot = 25045.0
            pcr = 1.15
            max_pain = 24800.0
            call_walls = [
                OptionWall(strike=26000, oi=103227, change_oi=37480, side="call"),
                OptionWall(strike=25500, oi=87500, change_oi=21000, side="call"),
                OptionWall(strike=26500, oi=72000, change_oi=44786, side="call"),
            ]
            put_walls = [
                OptionWall(strike=23000, oi=77231, change_oi=17173, side="put"),
                OptionWall(strike=24000, oi=68500, change_oi=12000, side="put"),
                OptionWall(strike=24300, oi=61200, change_oi=54732, side="put"),
            ]
            call_total = 410000.0
            put_total = 470000.0

        insights = self._build_insights(
            symbol, pcr, max_pain, spot, call_walls, put_walls
        )

        return OptionsSummary(
            symbol=symbol,
            instrument_key=instrument_key,
            expiry=expiry,
            trade_date=trade_date,
            spot=spot,
            pcr=pcr,
            max_pain=max_pain,
            call_oi_total=call_total,
            put_oi_total=put_total,
            top_call_walls=call_walls,
            top_put_walls=put_walls,
            insights=insights,
            as_of=_now_ist(),
            source="mock",
        )

    def _mock_chain(
        self,
        symbol: str,
        instrument_key: str,
        expiry: str,
        trade_date: str,
    ) -> OptionsChainResponse:
        # Generate a realistic ATM ± range
        if symbol == "BANKNIFTY":
            atm = 59700
            step = 100
        else:
            atm = 25000
            step = 50

        strikes: list[StrikeRow] = []
        for i in range(-12, 13):
            k = atm + i * step
            # Simple synthetic OI curve peaking near ATM / walls
            dist = abs(i)
            call_oi = max(5000, 90000 - dist * 5500 + (i * 800))
            put_oi = max(5000, 85000 - dist * 5200 - (i * 700))
            strikes.append(
                StrikeRow(
                    strike=float(k),
                    call_oi=float(call_oi),
                    put_oi=float(put_oi),
                    call_change_oi=float(3000 - dist * 200),
                    put_change_oi=float(2800 - dist * 180),
                )
            )

        return OptionsChainResponse(
            symbol=symbol,
            instrument_key=instrument_key,
            expiry=expiry,
            trade_date=trade_date,
            spot=float(atm + 45),
            strikes=strikes,
            as_of=_now_ist(),
            source="mock",
        )


def _f(val: Any) -> Optional[float]:
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None
