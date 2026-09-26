import httpx
from app.config import settings

class InsightFaceService:
    def __init__(self, base_url: str = settings.insightface_url, api_key: str | None = settings.insightface_api_key):
        self.base_url = base_url.rstrip("/")
        self.headers = {}
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"

    async def check_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/v1/health", headers=self.headers)
                return res.status_code == 200
        except Exception:
            return False

    async def compare_faces(self, source_bytes: bytes, target_bytes: bytes) -> dict:
        async with httpx.AsyncClient(timeout=15.0) as client:
            files = {
                "source": ("source.jpg", source_bytes, "image/jpeg"),
                "target": ("target.jpg", target_bytes, "image/jpeg"),
            }
            res = await client.post(f"{self.base_url}/v1/compare", files=files, headers=self.headers)
            res.raise_for_status()
            return res.json()

    async def extract_embeddings(self, image_bytes: bytes) -> dict:
        async with httpx.AsyncClient(timeout=15.0) as client:
            files = {
                "image": ("image.jpg", image_bytes, "image/jpeg")
            }
            res = await client.post(f"{self.base_url}/v1/embeddings", files=files, headers=self.headers)
            res.raise_for_status()
            return res.json()

insightface_service = InsightFaceService()
