"""Canonical recognition -> VisionEvent -> product/policy pipeline."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from core.contracts.events import VisionEvent

class RecognitionEventPipeline:
    def __init__(self, identity_service: Any, persistence: Any = None, attendance: Any = None, security: Any = None):
        self.identity_service = identity_service
        self.persistence = persistence
        self.attendance = attendance
        self.security = security

    async def process(self, image_bytes: bytes, *, camera_id: str, tenant_id: str = "default", threshold: float = 0.60):
        result = await self.identity_service.identify(
            image_bytes, tenant_id=tenant_id, limit=1, threshold=threshold
        )
        match = result.matches[0] if result.matches else None
        event = VisionEvent(
            type="face.recognized" if match else "face.unrecognized",
            occurred_at=datetime.now(timezone.utc),
            camera_id=camera_id,
            subject_id=match.identity_id if match else None,
            confidence=match.score if match else None,
            signals={"face_detected": True, "recognized": bool(match)},
            model=result.model,
            model_version=result.model_version,
            metadata={"tenant_id": tenant_id, "threshold": threshold},
        )
        persisted = None
        if self.persistence:
            persisted = await self.persistence.create_vision_event(event.model_dump(mode="json"))
            event.metadata["event_id"] = persisted.get("id")
        product_results: dict[str, Any] = {}
        if self.attendance and match:
            product_results["attendance"] = await self.attendance.process_event({
                **event.model_dump(mode="json"),
                "id": persisted.get("id") if persisted else None,
            })
        if self.security and persisted:
            product_results["security"] = await self.security.evaluate_event({
                **event.model_dump(mode="json"),
                "id": persisted.get("id"),
            })
        return event, {**result.model_dump(mode="json"), "products": product_results}
