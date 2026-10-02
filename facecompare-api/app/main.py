import json
import uuid
from datetime import datetime, timezone
import os
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.schemas import (
    EnrollmentResponse,
    FaceQualitySchema,
    HealthResponse,
    SearchMatchSchema,
    SearchResponse,
    VerificationAuditDetail,
    VerificationResponse,
)
from app.services.insightface import insightface_service
from app.services.qdrant import qdrant_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await qdrant_service.ensure_collections()
    except Exception:
        pass
    yield

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Identity and vision microservice powered by InsightFace and Qdrant",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", include_in_schema=False)
async def serve_ui():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "FaceCompare API is running. Access /docs for API documentation."}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    if_ok = await insightface_service.check_health()
    qd_ok = await qdrant_service.check_health()
    overall = "healthy" if (if_ok and qd_ok) else "degraded"
    return HealthResponse(
        status=overall,
        insightface_connected=if_ok,
        qdrant_connected=qd_ok,
        app_version=settings.app_version,
    )

@app.post("/api/v1/verify", response_model=VerificationResponse)
async def verify_identity(
    source_image: UploadFile = File(..., description="ID / Passport photo"),
    target_image: UploadFile = File(..., description="Live selfie photo"),
    threshold: float | None = Form(None, description="Custom similarity threshold [0.0 - 1.0]"),
):
    eff_threshold = threshold if threshold is not None else settings.default_match_threshold
    source_bytes = await source_image.read()
    target_bytes = await target_image.read()

    if not source_bytes or not target_bytes:
        raise HTTPException(status_code=400, detail="Source and target images cannot be empty")

    try:
        compare_res = await insightface_service.compare_faces(source_bytes, target_bytes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"InsightFace processing failed: {str(e)}")

    similarity = compare_res.get("similarity", 0.0)
    matched = similarity >= eff_threshold
    processing_ms = compare_res.get("processing_ms", 0.0)
    src_face = compare_res.get("source_face", {})
    tgt_face = compare_res.get("target_face", {})
    src_q = src_face.get("quality", {})
    tgt_q = tgt_face.get("quality", {})
    src_quality_schema = FaceQualitySchema(**src_q) if src_q else None
    tgt_quality_schema = FaceQualitySchema(**tgt_q) if tgt_q else None
    quality_pass = bool(
        (src_quality_schema and src_quality_schema.score > 0.4)
        and (tgt_quality_schema and tgt_quality_schema.score > 0.4)
    )

    verification_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    audit_payload = {
        "verification_id": verification_id,
        "matched": matched,
        "similarity": similarity,
        "threshold": eff_threshold,
        "quality_pass": quality_pass,
        "timestamp": now_iso,
        "source_filename": source_image.filename,
        "target_filename": target_image.filename,
        "source_quality": src_q,
        "target_quality": tgt_q,
    }

    try:
        await qdrant_service.store_verification_audit(
            point_id=verification_id,
            vector=src_face.get("embedding"),
            payload=audit_payload,
        )
    except Exception:
        pass

    return VerificationResponse(
        verification_id=verification_id,
        matched=matched,
        similarity=similarity,
        threshold=eff_threshold,
        quality_pass=quality_pass,
        source_quality=src_quality_schema,
        target_quality=tgt_quality_schema,
        processing_ms=processing_ms,
        created_at=now_iso,
    )

@app.post("/api/v1/enroll", response_model=EnrollmentResponse)
async def enroll_identity(
    image: UploadFile = File(...),
    person_id: str = Form(...),
    tenant_id: str = Form(...),
    name: str | None = Form(None),
    external_id: str | None = Form(None),
    metadata: str | None = Form(None, description="JSON metadata string"),
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file cannot be empty")

    try:
        embed_res = await insightface_service.extract_embeddings(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"InsightFace embedding extraction failed: {str(e)}")

    faces = embed_res.get("faces", [])
    if not faces:
        raise HTTPException(status_code=422, detail="No face detected in the provided image")

    primary_face = faces[0]
    embedding = primary_face.get("embedding")
    if not embedding:
        raise HTTPException(status_code=422, detail="Face embedding missing from InsightFace response")

    meta_dict = {}
    if metadata:
        try:
            meta_dict = json.loads(metadata)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON format for metadata field")

    vector_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "tenant_id": tenant_id,
        "person_id": person_id,
        "name": name,
        "external_id": external_id,
        "enrolled_at": now_iso,
        "filename": image.filename,
        "quality": primary_face.get("quality", {}),
        "metadata": meta_dict,
    }

    try:
        await qdrant_service.store_identity(point_id=vector_id, vector=embedding, payload=payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to store vector in Qdrant: {str(e)}")

    return EnrollmentResponse(
        person_id=person_id,
        name=name,
        external_id=external_id,
        vector_id=vector_id,
        embedding_dim=len(embedding),
        created_at=now_iso,
    )

@app.post("/api/v1/search", response_model=SearchResponse)
async def search_identity(
    image: UploadFile = File(...),
    tenant_id: str = Form(...),
    threshold: float | None = Form(None),
    limit: int = Form(5, ge=1, le=50),
):
    eff_threshold = threshold if threshold is not None else settings.default_match_threshold
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file cannot be empty")

    try:
        embed_res = await insightface_service.extract_embeddings(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"InsightFace embedding extraction failed: {str(e)}")

    faces = embed_res.get("faces", [])
    if not faces:
        raise HTTPException(status_code=422, detail="No face detected in the provided search image")

    primary_face = faces[0]
    embedding = primary_face.get("embedding")
    processing_ms = embed_res.get("processing_ms", 0.0)

    try:
        results = await qdrant_service.search_identities(
            query_vector=embedding,
            tenant_id=tenant_id,
            limit=limit,
            score_threshold=eff_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Qdrant search query failed: {str(e)}")

    matches = []
    for point in results:
        payload = point.get("payload", {})
        matches.append(
            SearchMatchSchema(
                person_id=payload.get("person_id", str(point.get("id"))),
                name=payload.get("name"),
                external_id=payload.get("external_id"),
                similarity=point.get("score", 0.0),
                metadata=payload.get("metadata", {}),
            )
        )

    quality_schema = FaceQualitySchema(**primary_face.get("quality", {})) if primary_face.get("quality") else None
    return SearchResponse(
        matches=matches,
        threshold=eff_threshold,
        searched_face_quality=quality_schema,
        processing_ms=processing_ms,
    )

@app.get("/api/v1/verifications/{verification_id}", response_model=VerificationAuditDetail)
async def get_verification(verification_id: str):
    try:
        point = await qdrant_service.get_verification_audit(verification_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Qdrant query failed: {str(e)}")

    if not point:
        raise HTTPException(status_code=404, detail=f"Verification record '{verification_id}' not found")

    payload = point.get("payload", {})
    return VerificationAuditDetail(
        verification_id=verification_id,
        similarity=payload.get("similarity", 0.0),
        matched=payload.get("matched", False),
        threshold=payload.get("threshold", 0.60),
        timestamp=payload.get("timestamp", ""),
        source_quality=FaceQualitySchema(**payload["source_quality"]) if payload.get("source_quality") else None,
        target_quality=FaceQualitySchema(**payload["target_quality"]) if payload.get("target_quality") else None,
        payload=payload,
    )
