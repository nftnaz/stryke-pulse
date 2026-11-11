import sys
from pathlib import Path
import asyncio

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.services.snapshot_scheduler import (
    SnapshotScheduler,
)

scheduler = SnapshotScheduler()

asyncio.run(
    scheduler.run_once()
)