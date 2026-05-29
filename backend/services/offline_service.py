"""GET /offline-pack · serves the bundled 200-country emergency number database.

Sets a long cache header so the Service Worker stores it for a week.
"""

from __future__ import annotations

import json
import os

from fastapi import APIRouter
from fastapi.responses import JSONResponse

offline_router = APIRouter()

_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "emergency_seed.json")
_CACHED: list[dict] | None = None


def _load_seed() -> list[dict]:
    global _CACHED
    if _CACHED is None:
        with open(_DATA_PATH, encoding="utf-8") as f:
            _CACHED = json.load(f)
    return _CACHED


def validate_seed_on_startup() -> int:
    """Preload + sanity-check the bundled seed.

    Called from the FastAPI lifespan so a missing/corrupt file fails loudly
    at boot rather than 503-ing the first /offline-pack request during a
    judge demo. Returns the country count on success; raises otherwise.
    """
    data = _load_seed()
    if not isinstance(data, list) or not data:
        raise RuntimeError(f"emergency_seed.json is empty or malformed at {_DATA_PATH}")
    return len(data)


@offline_router.get("/offline-pack", summary="Bundled 200-country emergency numbers")
async def get_offline_pack():
    data = _load_seed()
    return JSONResponse(
        content=data,
        headers={"Cache-Control": "public, max-age=604800, immutable"},
    )
