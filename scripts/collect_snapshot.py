import sys
from pathlib import Path
import asyncio

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.services.snapshot_collector import (
    SnapshotCollector,
)

collector = SnapshotCollector()

asyncio.run(
    collector.collect_nifty_snapshot()
)