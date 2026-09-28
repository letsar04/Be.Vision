"""Reusable attendance session logic driven by canonical VisionEvents."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

class AttendanceService:
    def __init__(self, persistence: Any):
        self.persistence = persistence

    async def process_event(self, event: dict[str, Any]) -> dict[str, Any] | None:
        subject_id = event.get("subject_id")
        if not subject_id or event.get("type") != "face.recognized":
            return None
        occurred_at = datetime.fromisoformat(str(event["occurred_at"]).replace("Z", "+00:00"))
        tenant_ref = str(event.get("metadata", {}).get("tenant_id", "default"))
        return await self.persistence.record_attendance_presence(
            tenant_ref=tenant_ref,
            identity_ref=str(subject_id),
            occurred_at=occurred_at,
            camera_ref=event.get("camera_id"),
            vision_event_id=event.get("id"),
        )
