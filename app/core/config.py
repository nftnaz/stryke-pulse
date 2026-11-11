from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Stryke Pulse"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me"

    host: str = "0.0.0.0"
    port: int = 8000

    # Upstox
    upstox_access_token: str = ""
    upstox_api_key: str = ""
    upstox_api_secret: str = ""
    upstox_v2_base_url: str = "https://api.upstox.com/v2"
    upstox_v3_base_url: str = "https://api.upstox.com/v3"

    # LLM
    llm_provider: Literal["groq", "ollama"] = "groq"
    groq_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    # Cache
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 60

    # Market
    default_index: str = "NIFTY"
    timezone: str = "Asia/Kolkata"


@lru_cache
def get_settings() -> Settings:
    return Settings()
