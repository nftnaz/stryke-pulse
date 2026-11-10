from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from loguru import logger

from app.core.config import get_settings
from app.routers import options, pulse

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="NSE F&O Market Intelligence Dashboard",
    version="0.1.0",
    debug=settings.debug,
)

# Static & templates
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# Routers
app.include_router(pulse.router)
app.include_router(options.router)


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "app_name": settings.app_name,
        },
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "upstox_token_set": bool(settings.upstox_access_token),
    }


@app.on_event("startup")
async def startup():
    logger.info(f"{settings.app_name} starting (env={settings.app_env})")
    if not settings.upstox_access_token:
        logger.warning("No UPSTOX_ACCESS_TOKEN – running with mock data")
