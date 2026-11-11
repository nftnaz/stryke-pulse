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