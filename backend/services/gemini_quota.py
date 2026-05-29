"""In-process Gemini API quota tracker.

Tracks per-minute (RPM) and per-day (RPD) usage against the free-tier limits
(60 RPM / 1500 RPD for gemini-2.0-flash as of 2026) so the backend can skip
the API call and fall through to rule-based / template fallback instead of
hitting a 429 mid-demo.

Why in-process: single-worker Render deployment. No Redis. If we ever scale
horizontally, share counters via Redis instead.

Usage:
    if gemini_quota.can_call():
        # call the API
        gemini_quota.record_call()
    else:
        # use fallback
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import UTC, datetime

logger = logging.getLogger(__name__)

# Thresholds — stay 5 requests below the hard limits so transient bursts
# don't flip us over before the window resets.
_RPM_LIMIT = 60
_RPD_LIMIT = 1500
_RPM_HEADROOM = 5
_RPD_HEADROOM = 20


class GeminiQuotaTracker:
    """Simple sliding-window RPM + daily RPD counter."""

    def __init__(self, rpm_limit: int = _RPM_LIMIT, rpd_limit: int = _RPD_LIMIT) -> None:
        self._rpm_limit = rpm_limit
        self._rpd_limit = rpd_limit
        self._lock = asyncio.Lock()

        # Per-minute: timestamps of calls in the last 60s (sliding window).
        self._minute_calls: list[float] = []

        # Per-day: count + UTC date string (reset when date changes).
        self._day_count = 0
        self._day_key = ""  # "YYYY-MM-DD" in UTC

    def _today_key(self) -> str:
        return datetime.now(tz=UTC).strftime("%Y-%m-%d")

    def _prune_minute(self, now: float) -> None:
        cutoff = now - 60.0
        self._minute_calls = [t for t in self._minute_calls if t > cutoff]

    def can_call(self) -> bool:
        """Return True synchronously — no lock needed for a quick read check.

        The check is optimistic (no lock) to keep hot-path latency low.
        Actual enforcement happens inside record_call() under the lock.
        """
        now = time.monotonic()
        today = self._today_key()

        # Count recent minute calls (approximate — no lock, slightly stale is fine)
        recent = sum(1 for t in self._minute_calls if t > now - 60.0)
        if recent >= self._rpm_limit - _RPM_HEADROOM:
            logger.info(
                "Gemini RPM guard · %d/%d recent calls · skipping API, using fallback",
                recent,
                self._rpm_limit,
            )
            return False

        # Check daily quota (reset if day changed)
        day_count = self._day_count if self._day_key == today else 0
        if day_count >= self._rpd_limit - _RPD_HEADROOM:
            logger.warning(
                "Gemini RPD guard · %d/%d daily calls · skipping API for today",
                day_count,
                self._rpd_limit,
            )
            return False

        return True

    async def record_call(self) -> None:
        """Record one completed (or attempted) Gemini API call."""
        now = time.monotonic()
        today = self._today_key()
        async with self._lock:
            self._prune_minute(now)
            self._minute_calls.append(now)
            if self._day_key != today:
                self._day_key = today
                self._day_count = 0
            self._day_count += 1

    def stats(self) -> dict:
        now = time.monotonic()
        today = self._today_key()
        recent = sum(1 for t in self._minute_calls if t > now - 60.0)
        day_count = self._day_count if self._day_key == today else 0
        return {
            "rpm_used": recent,
            "rpm_limit": self._rpm_limit,
            "rpd_used": day_count,
            "rpd_limit": self._rpd_limit,
            "rpm_ok": recent < self._rpm_limit - _RPM_HEADROOM,
            "rpd_ok": day_count < self._rpd_limit - _RPD_HEADROOM,
        }


# Shared singleton — both ai_triage and dispatch_service import this.
gemini_quota = GeminiQuotaTracker()
