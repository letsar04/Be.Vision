"""Recognition contracts shared by Core services."""

from pydantic import BaseModel, Field


class RecognitionMatch(BaseModel):
    identity_id: str
    score: float = Field(ge=0.0, le=1.0)


class RecognitionResponse(BaseModel):
    matches: list[RecognitionMatch]
    model: str
    model_version: str | None = None
    quality: float | None = Field(default=None, ge=0.0, le=1.0)
