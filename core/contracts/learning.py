"""Contracts for the controlled continuous-learning lifecycle."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class LearningExample(BaseModel):
    example_id: str
    task: str
    source_event_id: str | None = None
    input_uri: str | None = None
    label: dict[str, Any] = Field(default_factory=dict)
    feedback: dict[str, Any] = Field(default_factory=dict)
    dataset_version: str | None = None
    created_at: datetime
    review_status: Literal["pending", "accepted", "rejected"] = "pending"


class ModelVersion(BaseModel):
    model_id: str
    version: str
    task: str
    base_model: str | None = None
    dataset_version: str | None = None
    metrics: dict[str, float] = Field(default_factory=dict)
    status: Literal["candidate", "staging", "shadow", "production", "archived"] = "candidate"
    parent_version: str | None = None
    created_at: datetime


class EvaluationResult(BaseModel):
    model_id: str
    version: str
    evaluation_set: str
    passed: bool
    metrics: dict[str, float] = Field(default_factory=dict)
    regressions: list[str] = Field(default_factory=list)
    evaluated_at: datetime
