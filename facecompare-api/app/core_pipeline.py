"""Bridge the legacy FaceCompare service to reusable Core modules."""
from modules.events.pipeline import RecognitionEventPipeline
from modules.identity.service import IdentityService
from modules.vector_memory.qdrant import QdrantVectorMemory
from modules.persistence.supabase import SupabaseRepository
from app.config import settings
from app.services.insightface import insightface_service
persistence=None
if settings.supabase_url and settings.supabase_secret_key: persistence=SupabaseRepository(settings.supabase_url,settings.supabase_secret_key)
vector_memory=QdrantVectorMemory(base_url=settings.qdrant_url,collection="face_embeddings",vector_dim=settings.embedding_dim,api_key=settings.qdrant_api_key)
identity_service=IdentityService(insightface=insightface_service,vector_memory=vector_memory,persistence=persistence,threshold=settings.default_match_threshold)
recognition_event_pipeline=RecognitionEventPipeline(identity_service,persistence=persistence)
