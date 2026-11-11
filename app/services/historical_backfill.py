import asyncio

from app.core.database import db
from app.services.historical_service import (
    HistoricalService,
)

svc = HistoricalService()


INSTRUMENTS = [
    (
        "NIFTY",
        "NSE_INDEX|Nifty 50",
    ),
    (
        "BANKNIFTY",
        "NSE_INDEX|Nifty Bank",
    ),
    (
        "INDIA_VIX",
        "NSE_INDEX|India VIX",
    ),
]


async def load_symbol(
    symbol: str,
    instrument_key: str,
):

    print(
        f"Loading historical data for {symbol}"
    )

    response = await svc.get_candles(
        instrument_key=instrument_key,
        unit="days",
        interval=1,
        from_date="2026-01-01",
        to_date="2026-11-11",
    )

    candles = (
        response.get("data", {})
        .get("candles", [])
    )

    conn = db.get_connection()

    cursor = conn.cursor()

    inserted = 0

    for candle in candles:

        timestamp = candle[0]
        open_price = candle[1]
        high_price = candle[2]
        low_price = candle[3]
        close_price = candle[4]
        volume = candle[5]
        oi = candle[6]

        cursor.execute(
            """
            INSERT OR IGNORE INTO market_candles (
                symbol,
                timestamp,
                open,
                high,
                low,
                close,
                volume,
                open_interest
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                symbol,
                timestamp,
                open_price,
                high_price,
                low_price,
                close_price,
                volume,
                oi,
            ),
        )

        inserted += 1

    conn.commit()
    conn.close()

    print(
        f"{symbol}: {inserted} rows processed"
    )


async def main():

    db.initialize()

    for (
        symbol,
        instrument_key,
    ) in INSTRUMENTS:

        await load_symbol(
            symbol,
            instrument_key,
        )

    print(
        "Historical backfill completed."
    )


if __name__ == "__main__":
    asyncio.run(main())