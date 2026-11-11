from fastapi import APIRouter

from app.core.database import db

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
)


@router.get("/pcr-trend")
async def pcr_trend():

    conn = db.get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            timestamp,
            pcr
        FROM market_snapshots
        WHERE symbol='NIFTY'
        ORDER BY id DESC
        LIMIT 200
        """
    )

    rows = [
        dict(row)
        for row in cursor.fetchall()
    ]

    conn.close()

    return {
        "data": rows[::-1]
    }


@router.get("/support-trend")
async def support_trend():

    conn = db.get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            timestamp,
            support,
            resistance
        FROM market_snapshots
        WHERE symbol='NIFTY'
        ORDER BY id DESC
        LIMIT 200
        """
    )

    rows = [
        dict(row)
        for row in cursor.fetchall()
    ]

    conn.close()

    return {
        "data": rows[::-1]
    }


@router.get("/max-pain-trend")
async def max_pain_trend():

    conn = db.get_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            timestamp,
            max_pain
        FROM market_snapshots
        WHERE symbol='NIFTY'
        ORDER BY id DESC
        LIMIT 200
        """
    )

    rows = [
        dict(row)
        for row in cursor.fetchall()
    ]

    conn.close()

    return {
        "data": rows[::-1]
    }

from app.services.sector_service import SectorService

sector_svc = SectorService()


@router.get("/heatmap")
async def sector_heatmap(lookback_days: int = 5):
    """
    Sector performance heatmap data from stored daily candles.
    Returns list of { sector, symbol, change_pct, direction, closes[] }
    """
    return {
        "lookback_days": lookback_days,
        "data": sector_svc.heatmap_data(lookback_days=lookback_days),
    }


@router.get("/sector-flow")
async def sector_flow(lookback_days: int = 5):
    """Same data as pulse.sectors, exposed for Flow / Orderflow views."""
    flows = sector_svc.latest_sector_flows(lookback_days=lookback_days)
    return {
        "lookback_days": lookback_days,
        "inflows": [f.model_dump() for f in flows if f.direction == "in"],
        "outflows": [f.model_dump() for f in flows if f.direction == "out"],
        "neutral": [f.model_dump() for f in flows if f.direction == "neutral"],
        "all": [f.model_dump() for f in flows],
    }