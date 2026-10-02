import httpx
from typing import Any
from app.config import settings

class QdrantService:
    def __init__(
        self,
        base_url: str = settings.qdrant_url,
        api_key: str | None = settings.qdrant_api_key,
        vector_dim: int = settings.embedding_dim,
    ):
        self.base_url = base_url.rstrip("/")
        self.vector_dim = vector_dim
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["api-key"] = api_key

    async def check_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/readyz", headers=self.headers)
                return res.status_code == 200
        except Exception:
            return False

    async def ensure_collections(self) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for collection_name in [settings.verifications_collection, settings.identities_collection]:
                res = await client.get(f"{self.base_url}/collections/{collection_name}", headers=self.headers)
                if res.status_code != 200:
                    await client.put(
                        f"{self.base_url}/collections/{collection_name}",
                        json={"vectors":{"size":self.vector_dim,"distance":"Cosine"}},
                        headers=self.headers,
                    )

    async def store_verification_audit(self, point_id: str, vector: list[float] | None, payload: dict[str, Any]) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            vec = vector if vector else [0.0] * self.vector_dim
            body={"points":[{"id":point_id,"vector":vec,"payload":payload}]}
            res=await client.put(
                f"{self.base_url}/collections/{settings.verifications_collection}/points?wait=true",
                json=body,headers=self.headers,
            )
            res.raise_for_status()

    async def store_identity(self, point_id: str, vector: list[float], payload: dict[str, Any]) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            body={"points":[{"id":point_id,"vector":vector,"payload":payload}]}
            res=await client.put(
                f"{self.base_url}/collections/{settings.identities_collection}/points?wait=true",
                json=body,headers=self.headers,
            )
            res.raise_for_status()

    async def search_identities(
        self,
        query_vector: list[float],
        tenant_id: str,
        limit: int = 5,
        score_threshold: float = 0.60,
    ) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            body={
                "vector":query_vector,
                "limit":limit,
                "score_threshold":score_threshold,
                "with_payload":True,
                "filter":{"must":[{"key":"tenant_id","match":{"value":tenant_id}}]},
            }
            res=await client.post(
                f"{self.base_url}/collections/{settings.identities_collection}/points/search",
                json=body,headers=self.headers,
            )
            res.raise_for_status()
            return res.json().get("result",[])

    async def get_verification_audit(self, point_id: str) -> dict[str, Any] | None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res=await client.get(
                f"{self.base_url}/collections/{settings.verifications_collection}/points/{point_id}",
                headers=self.headers,
            )
            if res.status_code==404:
                return None
            res.raise_for_status()
            return res.json().get("result")

qdrant_service=QdrantService()
