from fastapi import APIRouter, Depends

from app.models.schemas import PulseResponse
from app.services.pulse_service import PulseService

router = APIRouter(prefix="/api", tags=["pulse"])


def get_pulse_service() -> PulseService:
    return PulseService()


@router.get("/pulse", response_model=PulseResponse)
async def get_market_pulse(svc: PulseService = Depends(get_pulse_service)):
    """
    High-level market pulse: mood, indices, VIX, sector flow summary.
    """
    return await svc.get_pulse()
