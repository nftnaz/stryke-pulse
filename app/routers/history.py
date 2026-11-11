from fastapi import APIRouter, Query

from app.services.historical_service import (
    HistoricalService,
)

router = APIRouter(
    prefix="/api/history",
    tags=["history"],
)

svc = HistoricalService()


@router.get("/nifty")
async def nifty_history(
    unit: str = Query("days"),
    interval: int = Query(
        1,
        ge=1,
        le=1,
    ),
    from_date: str | None = None,
    to_date: str | None = None,
):
    return await svc.get_candles(
        instrument_key="NSE_INDEX|Nifty 50",
        unit=unit,
        interval=interval,
        from_date=from_date,
        to_date=to_date,
    )
