"""Canonical recognition -> VisionEvent pipeline."""
from __future__ import annotations
from datetime import datetime,timezone
from typing import Any
from core.contracts.events import VisionEvent
class RecognitionEventPipeline:
    def __init__(self,identity_service:Any,persistence:Any=None): self.identity_service=identity_service; self.persistence=persistence
    async def process(self,image_bytes:bytes,*,camera_id:str,tenant_id:str="default",threshold:float=0.60):
        result=await self.identity_service.identify(image_bytes,tenant_id=tenant_id,limit=1,threshold=threshold); match=result.matches[0] if result.matches else None
        event=VisionEvent(type="face.recognized" if match else "face.unrecognized",occurred_at=datetime.now(timezone.utc),camera_id=camera_id,subject_id=match.identity_id if match else None,confidence=match.score if match else None,signals={"face_detected":True,"recognized":bool(match)},model=result.model,model_version=result.model_version,metadata={"tenant_id":tenant_id,"threshold":threshold})
        if self.persistence: await self.persistence.create_vision_event(event.model_dump(mode="json"))
        return event,result.model_dump(mode="json")
