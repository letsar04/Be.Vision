from typing import Any
from pydantic import BaseModel, Field

class FaceQualitySchema(BaseModel):
    score: float = 0.0
    sharpness: float = 0.0
    brightness: float = 0.0
    pose: float = 0.0

class BoundingBoxSchema(BaseModel):
    x: int
    y: int
    width: int
    height: int

class VerificationResponse(BaseModel):
    verification_id: str
    matched: bool
    similarity: float
    threshold: float
    quality_pass: bool
    source_quality: FaceQualitySchema | None = None
    target_quality: FaceQualitySchema | None = None
    processing_ms: float
    created_at: str

class EnrollmentResponse(BaseModel):
    person_id: str
    name: str | None = None
    external_id: str | None = None
    vector_id: str
    embedding_dim: int
    created_at: str

class SearchMatchSchema(BaseModel):
    person_id: str
    name: str | None = None
    external_id: str | None = None
    similarity: float
    metadata: dict[str, Any] = Field(default_factory=dict)

class SearchResponse(BaseModel):
    matches: list[SearchMatchSchema]
    threshold: float
    searched_face_quality: FaceQualitySchema | None = None
    processing_ms: float

class VerificationAuditDetail(BaseModel):
    verification_id: str
    similarity: float
    matched: bool
    threshold: float
    timestamp: str
    source_quality: FaceQualitySchema | None = None
    target_quality: FaceQualitySchema | None = None
    payload: dict[str, Any] = Field(default_factory=dict)

class HealthResponse(BaseModel):
    status: str
    insightface_connected: bool
    qdrant_connected: bool
    app_version: str
