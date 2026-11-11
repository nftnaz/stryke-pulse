"""
Derive sector performance from stored daily candles.
Used by Pulse (Money Rotation) and future Heatmaps.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from app.core.database import db
from app.models.schemas import SectorFlow
from app.services.upstox_client import SECTOR_LABELS, SECTOR_SYMBOLS


class SectorService:
    def latest_sector_flows(
        self,
        lookback_days: int = 5,
    ) -> list[SectorFlow]:
        """
        Compare latest close vs close `lookback_days` trading days ago.
        Returns SectorFlow list sorted by change_pct desc.
        """
        conn = db.get_connection()
        cursor = conn.cursor()

        flows: list[SectorFlow] = []

        for symbol in SECTOR_SYMBOLS:
            label = SECTOR_LABELS.get(symbol, symbol)

            cursor.execute(
                """
                SELECT timestamp, close
                FROM market_candles
                WHERE symbol = ?
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                (symbol, lookback_days + 1),
            )
            rows = cursor.fetchall()
            if len(rows) < 2:
                continue

            latest_close = rows[0]["close"]
            older_close = rows[-1]["close"]
            if not latest_close or not older_close:
                continue

            change_pct = ((latest_close - older_close) / older_close) * 100.0

            # Rough proxy for "flow" until we have real volume-value data
            net_flow_cr = change_pct * 100  # placeholder scale

            direction = (
                "in" if change_pct > 0.15
                else "out" if change_pct < -0.15
                else "neutral"
            )

            flows.append(
                SectorFlow(
                    sector=label,
                    net_flow_cr=round(net_flow_cr, 1),
                    change_pct=round(change_pct, 2),
                    direction=direction,
                )
            )

        conn.close()
        flows.sort(key=lambda f: (f.change_pct or 0), reverse=True)
        return flows

    def heatmap_data(self, lookback_days: int = 5) -> list[dict]:
        """
        One row per sector for heatmap tiles.
        Includes recent closes so the UI can show a mini sparkline later.
        """
        conn = db.get_connection()
        cursor = conn.cursor()
        rows_out: list[dict] = []

        for symbol in SECTOR_SYMBOLS:
            label = SECTOR_LABELS.get(symbol, symbol)
            cursor.execute(
                """
                SELECT timestamp, close
                FROM market_candles
                WHERE symbol = ?
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                (symbol, lookback_days + 1),
            )
            rows = cursor.fetchall()
            if len(rows) < 2:
                continue

            closes = [r["close"] for r in reversed(rows) if r["close"] is not None]
            if len(closes) < 2:
                continue

            latest, older = closes[-1], closes[0]
            change_pct = ((latest - older) / older) * 100.0
            direction = (
                "in" if change_pct > 0.15
                else "out" if change_pct < -0.15
                else "neutral"
            )

            rows_out.append({
                "symbol": symbol,
                "sector": label,
                "change_pct": round(change_pct, 2),
                "direction": direction,
                "latest_close": latest,
                "closes": closes,  # oldest → newest
            })

        conn.close()
        rows_out.sort(key=lambda x: x["change_pct"], reverse=True)
        return rows_out