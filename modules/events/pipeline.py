"""Product-neutral recognition-to-event pipeline."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
from core.contracts.events import VisionEvent

class RecognitionEventPipeline:
    def __init__(self, identity_service: Any):
        self.identity_service = identity_service

    async def process(self, image_bytes: bytes, *, camera_id: str, tenant_id: str = "default", threshold: float = 0.60) -> tuple[VisionEvent, dict[str, Any]]:
        recognition = await self.identity_service.identify(image_bytes, tenant_id=tenant_id, threshold=threshold, limit=1)
        top = recognition.matches[0] if recognition.matches else None
        event = VisionEvent(
            type="face.recognized" if top else "face.unrecognized",
            occurred_at=datetime.now(timezone.utc),
            camera_id=camera_id,
            subject_id=top.identity_id if top else None,
            confidence=top.score if top else None,
            signals={"face_detected": bool(recognition.matches) or recognition.quality is not None, "recognized": top is not None},
            model=recognition.model,
            model_version=recognition.model_version,
        )
        return event, {"recognition": recognition.model_dump()}
