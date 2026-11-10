from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.models.schemas import OptionsChainResponse, OptionsSummary
from app.services.options_service import OptionsService

router = APIRouter(prefix="/api/options", tags=["options"])


def get_options_service() -> OptionsService:
    return OptionsService()


@router.get("/{symbol}", response_model=OptionsSummary)
async def get_options_summary(
    symbol: str,
    expiry: Optional[str] = Query(None, description="YYYY-MM-DD"),
    trade_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    svc: OptionsService = Depends(get_options_service),
):
    """
    Options Intelligence summary:
    PCR, Max Pain, top OI walls, change-in-OI highlights and short insights.
    """
    return await svc.get_summary(symbol=symbol, expiry=expiry, trade_date=trade_date)


@router.get("/{symbol}/chain", response_model=OptionsChainResponse)
async def get_option_chain(
    symbol: str,
    expiry: Optional[str] = Query(None, description="YYYY-MM-DD"),
    trade_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    svc: OptionsService = Depends(get_options_service),
):
    return await svc.get_chain(
        symbol=symbol,
        expiry=expiry,
        trade_date=trade_date,
    )


@router.get("/debug/upstox")
async def debug_upstox():
    client = UpstoxClient()

    return await client.get_market_quote(
        [
            "NSE_INDEX|Nifty 50"
        ]
    )
