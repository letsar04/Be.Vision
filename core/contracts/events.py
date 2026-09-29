"""Canonical event contracts.

Keep events product-neutral so attendance, security and analytics can consume them.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class VisionEvent(BaseModel):
    type: str
    occurred_at: datetime
    camera_id: Optional[str] = None
    subject_id: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    signals: dict[str, Any] = Field(default_factory=dict)
    model: Optional[str] = None
    model_version: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
