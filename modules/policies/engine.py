"""Deterministic policy evaluation; no LLM is involved in the decision path."""
from __future__ import annotations
from datetime import datetime
from typing import Any

class PolicyEngine:
    def evaluate(self, event: dict[str, Any], *, allowed_identity_ids: set[str] | None = None, start_hour: int | None = None, end_hour: int | None = None) -> dict[str, Any]:
        reasons: list[str] = []
        subject_id = event.get("subject_id")
        occurred_at = datetime.fromisoformat(event["occurred_at"].replace("Z", "+00:00"))
        if allowed_identity_ids is not None and subject_id not in allowed_identity_ids:
            reasons.append("identity_not_allowed")
        if start_hour is not None and end_hour is not None:
            hour = occurred_at.hour
            in_window = start_hour <= hour < end_hour if start_hour < end_hour else (hour >= start_hour or hour < end_hour)
            if not in_window:
                reasons.append("outside_schedule")
        return {"matched": bool(reasons), "reasons": reasons, "actionable": bool(reasons)}
