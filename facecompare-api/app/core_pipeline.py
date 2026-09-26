"""Bridge the legacy FaceCompare service to reusable Core modules."""

from modules.events.pipeline import RecognitionEventPipeline
from modules.identity.service import IdentityService
from modules.vector_memory.qdrant import QdrantVectorMemory

from app.config import settings
from app.services.insightface import insightface_service

vector_memory = QdrantVectorMemory(
    base_url=settings.qdrant_url,
    collection="face_embeddings",
    vector_dim=settings.embedding_dim,
    api_key=settings.qdrant_api_key,
)

identity_service = IdentityService(
    insightface=insightface_service,
    vector_memory=vector_memory,
    threshold=settings.default_match_threshold,
)

recognition_event_pipeline = RecognitionEventPipeline(identity_service)
