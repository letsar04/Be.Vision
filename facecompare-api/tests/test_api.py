import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health_check_degraded():
    with patch("app.main.insightface_service.check_health", new_callable=AsyncMock) as mock_if,          patch("app.main.qdrant_service.check_health", new_callable=AsyncMock) as mock_qd:
        mock_if.return_value=True
        mock_qd.return_value=False
        res=client.get("/health")
        assert res.status_code==200
        data=res.json()
        assert data["status"]=="degraded"

def test_health_check_healthy():
    with patch("app.main.insightface_service.check_health", new_callable=AsyncMock) as mock_if,          patch("app.main.qdrant_service.check_health", new_callable=AsyncMock) as mock_qd:
        mock_if.return_value=True
        mock_qd.return_value=True
        res=client.get("/health")
        assert res.status_code==200
        assert res.json()["status"]=="healthy"

def test_enroll_identity_success():
    fake_embed_res={"faces":[{"embedding":[0.05]*512,"quality":{"score":0.95,"sharpness":0.9,"brightness":0.8,"pose":0.0}}]}
    with patch("app.main.insightface_service.extract_embeddings", new_callable=AsyncMock) as mock_embed,          patch("app.main.qdrant_service.store_identity", new_callable=AsyncMock) as mock_store:
        mock_embed.return_value=fake_embed_res
        res=client.post(
            "/api/v1/enroll",
            files={"image":("face.jpg",b"fake_face_bytes","image/jpeg")},
            data={"person_id":"usr_12345","tenant_id":"tenant_1","name":"Jean Dupont","external_id":"EXT-9988","metadata":"{}"},
        )
        assert res.status_code==200
        data=res.json()
        assert data["person_id"]=="usr_12345"
        assert data["embedding_dim"]==512
        mock_store.assert_called_once()

def test_search_identity_success():
    fake_embed_res={"faces":[{"embedding":[0.05]*512,"quality":{"score":0.92,"sharpness":0.85,"brightness":0.8,"pose":0.0}}],"processing_ms":15.0}
    fake_qdrant_matches=[{"id":"vec-111","score":0.82,"payload":{"person_id":"usr_12345","name":"Jean Dupont","external_id":"EXT-9988","metadata":{"department":"R&D"}}}]
    with patch("app.main.insightface_service.extract_embeddings", new_callable=AsyncMock) as mock_embed,          patch("app.main.qdrant_service.search_identities", new_callable=AsyncMock) as mock_search:
        mock_embed.return_value=fake_embed_res
        mock_search.return_value=fake_qdrant_matches
        res=client.post(
            "/api/v1/search",
            files={"image":("search_face.jpg",b"fake_search_bytes","image/jpeg")},
            data={"tenant_id":"tenant_1","threshold":"0.70","limit":"5"},
        )
        assert res.status_code==200
        assert len(res.json()["matches"])==1
        assert res.json()["matches"][0]["person_id"]=="usr_12345"
        mock_search.assert_called_once()
