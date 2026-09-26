"""Reusable identity service built on InsightFace and vector memory."""

from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Any
from core.contracts.recognition import RecognitionMatch, RecognitionResponse

class IdentityService:
    def __init__(self, insightface: Any, vector_memory: Any, threshold: float = 0.60):
        self.insightface = insightface
        self.vector_memory = vector_memory
        self.threshold = threshold

    async def enroll(self, image_bytes: bytes, identity_id: str, *, tenant_id: str = "default", metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        result = await self.insightface.extract_embeddings(image_bytes)
        faces = result.get("faces", [])
        if not faces:
            raise ValueError("No face detected")
        face = faces[0]
        embedding = face.get("embedding")
        if not embedding:
            raise ValueError("Face embedding missing")
        enrollment_id = str(uuid.uuid4())
        payload = {
            "tenant_id": tenant_id,
            "identity_id": identity_id,
            "enrollment_id": enrollment_id,
            "model": "insightface",
            "model_version": result.get("model_version"),
            "quality": face.get("quality", {}),
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await self.vector_memory.upsert(point_id=enrollment_id, vector=embedding, payload=payload)
        return {"identity_id": identity_id, "enrollment_id": enrollment_id, "embedding_dim": len(embedding), "quality": face.get("quality", {})}

    async def identify(self, image_bytes: bytes, *, tenant_id: str = "default", limit: int = 5, threshold: float | None = None) -> RecognitionResponse:
        result = await self.insightface.extract_embeddings(image_bytes)
        faces = result.get("faces", [])
        if not faces:
            return RecognitionResponse(matches=[], model="insightface", model_version=result.get("model_version"))
        face = faces[0]
        embedding = face.get("embedding")
        if not embedding:
            return RecognitionResponse(matches=[], model="insightface", model_version=result.get("model_version"))
        matches = await self.vector_memory.search(
            vector=embedding, limit=limit,
            score_threshold=threshold if threshold is not None else self.threshold,
            tenant_id=tenant_id,
        )
        return RecognitionResponse(
            matches=[RecognitionMatch(identity_id=item["payload"].get("identity_id", str(item["id"])), score=float(item.get("score", 0.0))) for item in matches],
            model="insightface",
            model_version=result.get("model_version"),
            quality=(face.get("quality") or {}).get("score"),
        )
