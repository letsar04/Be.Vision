import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health_check_degraded():
    with patch("app.main.insightface_service.check_health", new_callable=AsyncMock) as mock_if, \
         patch("app.main.qdrant_service.check_health", new_callable=AsyncMock) as mock_qd:
        mock_if.return_value = True
        mock_qd.return_value = False

        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "degraded"
        assert data["insightface_connected"] is True
        assert data["qdrant_connected"] is False

def test_health_check_healthy():
    with patch("app.main.insightface_service.check_health", new_callable=AsyncMock) as mock_if, \
         patch("app.main.qdrant_service.check_health", new_callable=AsyncMock) as mock_qd:
        mock_if.return_value = True
        mock_qd.return_value = True

        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"

def test_verify_identity_success():
    fake_compare_res = {
        "similarity": 0.85,
        "processing_ms": 42.5,
        "source_face": {
            "quality": {"score": 0.9, "sharpness": 0.8, "brightness": 0.7, "pose": 0.1},
            "embedding": [0.1] * 512,
        },
        "target_face": {
            "quality": {"score": 0.88, "sharpness": 0.75, "brightness": 0.7, "pose": 0.05},
        },
    }

    with patch("app.main.insightface_service.compare_faces", new_callable=AsyncMock) as mock_comp, \
         patch("app.main.qdrant_service.store_verification_audit", new_callable=AsyncMock) as mock_store:
        mock_comp.return_value = fake_compare_res

        source_file = ("passport.jpg", b"fake_source_jpeg_bytes", "image/jpeg")
        target_file = ("selfie.jpg", b"fake_target_jpeg_bytes", "image/jpeg")

        res = client.post(
            "/api/v1/verify",
            files={"source_image": source_file, "target_image": target_file},
            data={"threshold": "0.60"},
        )

        assert res.status_code == 200
        data = res.json()
        assert data["matched"] is True
        assert data["similarity"] == 0.85
        assert data["quality_pass"] is True
        assert data["threshold"] == 0.60
        assert "verification_id" in data
        mock_store.assert_called_once()

def test_enroll_identity_success():
    fake_embed_res = {
        "faces": [
            {
                "embedding": [0.05] * 512,
                "quality": {"score": 0.95, "sharpness": 0.9, "brightness": 0.8, "pose": 0.0},
            }
        ]
    }

    with patch("app.main.insightface_service.extract_embeddings", new_callable=AsyncMock) as mock_embed, \
         patch("app.main.qdrant_service.store_identity", new_callable=AsyncMock) as mock_store:
        mock_embed.return_value = fake_embed_res

        image_file = ("face.jpg", b"fake_face_bytes", "image/jpeg")

        res = client.post(
            "/api/v1/enroll",
            files={"image": image_file},
            data={
                "person_id": "usr_12345",
                "name": "Jean Dupont",
                "external_id": "EXT-9988",
                "metadata": '{"department": "R&D", "site": "Paris"}',
            },
        )

        assert res.status_code == 200
        data = res.json()
        assert data["person_id"] == "usr_12345"
        assert data["name"] == "Jean Dupont"
        assert data["external_id"] == "EXT-9988"
        assert data["embedding_dim"] == 512
        assert "vector_id" in data
        mock_store.assert_called_once()

def test_search_identity_success():
    fake_embed_res = {
        "faces": [
            {
                "embedding": [0.05] * 512,
                "quality": {"score": 0.92, "sharpness": 0.85, "brightness": 0.8, "pose": 0.0},
            }
        ],
        "processing_ms": 15.0,
    }

    fake_qdrant_matches = [
        {
            "id": "vec-111",
            "score": 0.82,
            "payload": {
                "person_id": "usr_12345",
                "name": "Jean Dupont",
                "external_id": "EXT-9988",
                "metadata": {"department": "R&D"},
            },
        }
    ]

    with patch("app.main.insightface_service.extract_embeddings", new_callable=AsyncMock) as mock_embed, \
         patch("app.main.qdrant_service.search_identities", new_callable=AsyncMock) as mock_search:
        mock_embed.return_value = fake_embed_res
        mock_search.return_value = fake_qdrant_matches

        image_file = ("search_face.jpg", b"fake_search_bytes", "image/jpeg")

        res = client.post(
            "/api/v1/search",
            files={"image": image_file},
            data={"threshold": "0.70", "limit": "5"},
        )

        assert res.status_code == 200
        data = res.json()
        assert len(data["matches"]) == 1
        assert data["matches"][0]["person_id"] == "usr_12345"
        assert data["matches"][0]["similarity"] == 0.82
        assert data["matches"][0]["name"] == "Jean Dupont"

def test_get_verification_not_found():
    with patch("app.main.qdrant_service.get_verification_audit", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None

        res = client.get("/api/v1/verifications/non_existent_uuid")
        assert res.status_code == 404
        assert "not found" in res.json()["detail"]
