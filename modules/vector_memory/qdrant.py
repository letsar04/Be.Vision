"""Qdrant adapter used by reusable Be.Vision modules."""
from __future__ import annotations
from typing import Any
import httpx

class QdrantVectorMemory:
    def __init__(self, base_url: str, collection: str = "face_embeddings", vector_dim: int = 512, api_key: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.collection = collection
        self.vector_dim = vector_dim
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["api-key"] = api_key

    async def ensure_collection(self) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{self.base_url}/collections/{self.collection}", headers=self.headers)
            if response.status_code == 200:
                return
            if response.status_code != 404:
                response.raise_for_status()
            response = await client.put(
                f"{self.base_url}/collections/{self.collection}",
                json={"vectors": {"size": self.vector_dim, "distance": "Cosine"}},
                headers=self.headers,
            )
            response.raise_for_status()

    async def upsert(self, *, point_id: str, vector: list[float], payload: dict[str, Any]) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.put(
                f"{self.base_url}/collections/{self.collection}/points?wait=true",
                json={"points": [{"id": point_id, "vector": vector, "payload": payload}]},
                headers=self.headers,
            )
            response.raise_for_status()

    async def search(self, *, vector: list[float], limit: int, score_threshold: float, tenant_id: str) -> list[dict[str, Any]]:
        body = {
            "vector": vector,
            "limit": limit,
            "score_threshold": score_threshold,
            "with_payload": True,
            "filter": {"must": [{"key": "tenant_id", "match": {"value": tenant_id}}]},
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{self.base_url}/collections/{self.collection}/points/search",
                json=body,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json().get("result", [])
