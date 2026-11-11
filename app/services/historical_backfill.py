"""
Backfill daily OHLCV for broad + sector indices into market_candles.
Pulls ~2 years of data in yearly chunks to stay within Upstox limits.
"""

from __future__ import annotations

import asyncio
from datetime import date, timedelta
from typing import Iterable

from loguru import logger

from app.core.database import db
from app.services.historical_service import HistoricalService
from app.services.upstox_client import (
    INDEX_KEYS,
    SECTOR_LABELS,
    SECTOR_SYMBOLS,
)

svc = HistoricalService()

# Broad indices we always want
BROAD = [
    ("NIFTY", INDEX_KEYS["NIFTY"]),
    ("BANKNIFTY", INDEX_KEYS["BANKNIFTY"]),
    ("INDIA_VIX", INDEX_KEYS["INDIA_VIX"]),
    ("FINNIFTY", INDEX_KEYS["FINNIFTY"]),
]

# Sector indices for rotation + heatmaps
SECTORS = [(sym, INDEX_KEYS[sym]) for sym in SECTOR_SYMBOLS if sym in INDEX_KEYS]


def _date_chunks(from_d: date, to_d: date, months: int = 12) -> list[tuple[date, date]]:
    """Split [from_d, to_d] into ~`months`-long chunks (inclusive)."""
    chunks: list[tuple[date, date]] = []
    cur = from_d
    while cur <= to_d:
        end = min(cur + timedelta(days=months * 30), to_d)
        chunks.append((cur, end))
        cur = end + timedelta(days=1)
    return chunks


async def load_symbol(
    symbol: str,
    instrument_key: str,
    from_date: date,
    to_date: date,
    sector: str | None = None,
) -> int:
    total_inserted = 0
    conn = db.get_connection()
    cursor = conn.cursor()

    for chunk_from, chunk_to in _date_chunks(from_date, to_date, months=12):
        logger.info(
            f"{symbol}: fetching {chunk_from} → {chunk_to}"
        )
        try:
            response = await svc.get_candles(
                instrument_key=instrument_key,
                unit="days",
                interval=1,
                from_date=chunk_from.isoformat(),
                to_date=chunk_to.isoformat(),
            )
        except Exception as e:
            logger.warning(f"{symbol} chunk failed: {e}")
            await asyncio.sleep(1.0)
            continue

        candles = (response.get("data") or {}).get("candles") or []
        if not candles:
            logger.warning(f"{symbol}: no candles for {chunk_from}→{chunk_to}")
            continue

        for candle in candles:
            # Upstox candle: [ts, open, high, low, close, volume, oi]
            ts, o, h, l, c, vol, oi = (
                candle[0],
                candle[1],
                candle[2],
                candle[3],
                candle[4],
                candle[5] if len(candle) > 5 else None,
                candle[6] if len(candle) > 6 else None,
            )
            cursor.execute(
                """
                INSERT OR IGNORE INTO market_candles (
                    symbol, timestamp, open, high, low, close,
                    volume, open_interest, sector
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (symbol, ts, o, h, l, c, vol, oi, sector),
            )
            total_inserted += 1

        conn.commit()
        await asyncio.sleep(0.4)  # be polite to the API

    conn.close()
    logger.info(f"{symbol}: {total_inserted} rows processed")
    return total_inserted


async def main(
    years: float = 2.0,
    include_sectors: bool = True,
):
    db.initialize()

    to_d = date.today()
    from_d = to_d - timedelta(days=int(years * 365))

    logger.info(f"Backfill window: {from_d} → {to_d}")

    instruments: list[tuple[str, str, str | None]] = [
        (sym, key, None) for sym, key in BROAD
    ]
    if include_sectors:
        instruments += [
            (sym, key, SECTOR_LABELS.get(sym))
            for sym, key in SECTORS
        ]

    grand_total = 0
    for symbol, instrument_key, sector in instruments:
        n = await load_symbol(
            symbol=symbol,
            instrument_key=instrument_key,
            from_date=from_d,
            to_date=to_d,
            sector=sector,
        )
        grand_total += n

    logger.info(f"Historical backfill completed. Total rows touched: {grand_total}")


if __name__ == "__main__":
    asyncio.run(main(years=2.0, include_sectors=True))