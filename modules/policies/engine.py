"""Deterministic policy evaluation; no LLM is involved in the decision path."""
from __future__ import annotations
from datetime import datetime
from typing import Any

class PolicyEngine:
    def evaluate(self, event: dict[str, Any], *, allowed_identity_ids: set[str] | None = None,
                 start_hour: int | None = None, end_hour: int | None = None) -> dict[str, Any]:
        reasons: list[str] = []
        subject_id = event.get("subject_id")
        occurred_at = datetime.fromisoformat(str(event["occurred_at"]).replace("Z", "+00:00"))
        if allowed_identity_ids is not None and subject_id not in allowed_identity_ids:
            reasons.append("identity_not_allowed")
        if start_hour is not None and end_hour is not None:
            hour = occurred_at.hour
            in_window = start_hour <= hour < end_hour if start_hour < end_hour else (hour >= start_hour or hour < end_hour)
            if not in_window: reasons.append("outside_schedule")
        return {"matched": bool(reasons), "reasons": reasons, "actionable": bool(reasons)}

    def evaluate_definition(self, event: dict[str, Any], definition: dict[str, Any]) -> dict[str, Any]:
        reasons: list[str] = []
        event_types = definition.get("event_types")
        if event_types and event.get("type") not in event_types:
            return {"matched": False, "reasons": ["event_type_not_selected"], "actionable": False}
        subject_id = event.get("subject_id")
        allowed = definition.get("allowed_identity_ids")
        if allowed is not None and subject_id not in set(map(str, allowed)):
            reasons.append("identity_not_allowed")
        occurred_at = datetime.fromisoformat(str(event["occurred_at"]).replace("Z", "+00:00"))
        schedule = definition.get("schedule") or {}
        if "start_hour" in schedule and "end_hour" in schedule:
            start, end, hour = int(schedule["start_hour"]), int(schedule["end_hour"]), occurred_at.hour
            in_window = start <= hour < end if start < end else (hour >= start or hour < end)
            if not in_window: reasons.append("outside_schedule")
        signals = event.get("signals") or {}
        for key in definition.get("required_signals", []):
            if not signals.get(key): reasons.append(f"missing_signal:{key}")
        for key in definition.get("forbidden_signals", []):
            if signals.get(key): reasons.append(f"forbidden_signal:{key}")
        zones = definition.get("zones")
        if zones and event.get("metadata", {}).get("zone") not in zones:
            reasons.append("zone_not_selected")
        return {"matched": bool(reasons), "reasons": reasons, "actionable": bool(reasons)}
