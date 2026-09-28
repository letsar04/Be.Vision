import json
import uuid
from datetime import datetime, timezone
import os
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import asyncio
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.schemas import (
    EnrollmentResponse, FaceQualitySchema, HealthResponse, SearchMatchSchema,
    SearchResponse, VerificationAuditDetail, VerificationResponse,
)
from app.services.insightface import insightface_service
from app.services.qdrant import qdrant_service
from app.core_pipeline import identity_service, vector_memory, recognition_event_pipeline
from contextlib import asynccontextmanager
from modules.camera import CameraManager
from modules.persistence.supabase import SupabaseRepository

persistence = None
if settings.supabase_url and settings.supabase_secret_key:
    persistence = SupabaseRepository(settings.supabase_url, settings.supabase_secret_key)
camera_manager = CameraManager(persistence=persistence, pipeline=recognition_event_pipeline)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await qdrant_service.ensure_collections()
        await vector_memory.ensure_collection()
    except Exception:
        pass
    yield

app = FastAPI(title=settings.app_name, version=settings.app_version,
              description="Be.Vision identity, camera and computer-vision core", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", include_in_schema=False)
async def serve_ui():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path): return FileResponse(index_path)
    return {"message": "Be.Vision API is running. Open /camera/control for the control center."}

@app.get("/camera/control", include_in_schema=False)
async def camera_control():
    return FileResponse(os.path.join(static_dir, "camera-control.html"))

@app.get("/camera/phone", include_in_schema=False)
async def phone_camera():
    return FileResponse(os.path.join(static_dir, "phone-camera.html"))

@app.get("/health", response_model=HealthResponse)
async def health_check():
    if_ok = await insightface_service.check_health()
    qd_ok = await qdrant_service.check_health()
    overall = "healthy" if (if_ok and qd_ok) else "degraded"
    return HealthResponse(status=overall, insightface_connected=if_ok,
                          qdrant_connected=qd_ok, app_version=settings.app_version)

@app.post("/api/v1/verify", response_model=VerificationResponse)
async def verify_identity(source_image: UploadFile = File(...), target_image: UploadFile = File(...),
                          threshold: float | None = Form(None)):
    eff_threshold = threshold if threshold is not None else settings.default_match_threshold
    source_bytes, target_bytes = await source_image.read(), await target_image.read()
    if not source_bytes or not target_bytes: raise HTTPException(400, "Source and target images cannot be empty")
    try: compare_res = await insightface_service.compare_faces(source_bytes, target_bytes)
    except Exception as e: raise HTTPException(502, f"InsightFace processing failed: {e}")
    similarity = compare_res.get("similarity", 0.0); matched = similarity >= eff_threshold
    src_face, tgt_face = compare_res.get("source_face", {}), compare_res.get("target_face", {})
    src_q, tgt_q = src_face.get("quality", {}), tgt_face.get("quality", {})
    src_quality_schema = FaceQualitySchema(**src_q) if src_q else None
    tgt_quality_schema = FaceQualitySchema(**tgt_q) if tgt_q else None
    quality_pass = bool(src_quality_schema and tgt_quality_schema and src_quality_schema.score > .4 and tgt_quality_schema.score > .4)
    verification_id, now_iso = str(uuid.uuid4()), datetime.now(timezone.utc).isoformat()
    try:
        await qdrant_service.store_verification_audit(point_id=verification_id, vector=src_face.get("embedding"),
            payload={"verification_id":verification_id,"matched":matched,"similarity":similarity,"threshold":eff_threshold,
                     "quality_pass":quality_pass,"timestamp":now_iso,"source_quality":src_q,"target_quality":tgt_q})
    except Exception: pass
    return VerificationResponse(verification_id=verification_id, matched=matched, similarity=similarity,
        threshold=eff_threshold, quality_pass=quality_pass, source_quality=src_quality_schema,
        target_quality=tgt_quality_schema, processing_ms=compare_res.get("processing_ms", 0.0), created_at=now_iso)

@app.post("/api/v1/enroll", response_model=EnrollmentResponse)
async def enroll_identity(image: UploadFile = File(...), person_id: str = Form(...),
                          name: str | None = Form(None), external_id: str | None = Form(None),
                          metadata: str | None = Form(None)):
    image_bytes = await image.read()
    if not image_bytes: raise HTTPException(400, "Image file cannot be empty")
    try: embed_res = await insightface_service.extract_embeddings(image_bytes)
    except Exception as e: raise HTTPException(502, f"InsightFace embedding extraction failed: {e}")
    faces = embed_res.get("faces", [])
    if not faces: raise HTTPException(422, "No face detected in the provided image")
    primary_face, embedding = faces[0], faces[0].get("embedding")
    if not embedding: raise HTTPException(422, "Face embedding missing from InsightFace response")
    meta_dict = {}
    if metadata:
        try: meta_dict = json.loads(metadata)
        except Exception: raise HTTPException(400, "Invalid JSON format for metadata field")
    vector_id, now_iso = str(uuid.uuid4()), datetime.now(timezone.utc).isoformat()
    await qdrant_service.store_identity(point_id=vector_id, vector=embedding,
        payload={"person_id":person_id,"name":name,"external_id":external_id,"enrolled_at":now_iso,
                 "filename":image.filename,"quality":primary_face.get("quality",{}),"metadata":meta_dict})
    return EnrollmentResponse(person_id=person_id,name=name,external_id=external_id,vector_id=vector_id,
                              embedding_dim=len(embedding),created_at=now_iso)

@app.post("/api/v1/search", response_model=SearchResponse)
async def search_identity(image: UploadFile = File(...), threshold: float | None = Form(None),
                          limit: int = Form(5, ge=1, le=50)):
    eff_threshold = threshold if threshold is not None else settings.default_match_threshold
    image_bytes = await image.read()
    if not image_bytes: raise HTTPException(400, "Image file cannot be empty")
    try: embed_res = await insightface_service.extract_embeddings(image_bytes)
    except Exception as e: raise HTTPException(502, f"InsightFace embedding extraction failed: {e}")
    faces = embed_res.get("faces", [])
    if not faces: raise HTTPException(422, "No face detected in the provided search image")
    primary_face = faces[0]
    try: results = await qdrant_service.search_identities(query_vector=primary_face.get("embedding"), limit=limit, score_threshold=eff_threshold)
    except Exception as e: raise HTTPException(502, f"Qdrant search query failed: {e}")
    matches=[]
    for point in results:
        payload=point.get("payload", {})
        matches.append(SearchMatchSchema(person_id=payload.get("person_id",str(point.get("id"))),
            name=payload.get("name"),external_id=payload.get("external_id"),similarity=point.get("score",0.0),
            metadata=payload.get("metadata",{})))
    q=FaceQualitySchema(**primary_face.get("quality",{})) if primary_face.get("quality") else None
    return SearchResponse(matches=matches,threshold=eff_threshold,searched_face_quality=q,
                          processing_ms=embed_res.get("processing_ms",0.0))

@app.get("/api/v1/verifications/{verification_id}", response_model=VerificationAuditDetail)
async def get_verification(verification_id: str):
    try: point=await qdrant_service.get_verification_audit(verification_id)
    except Exception as e: raise HTTPException(502, f"Qdrant query failed: {e}")
    if not point: raise HTTPException(404, f"Verification record '{verification_id}' not found")
    payload=point.get("payload",{})
    return VerificationAuditDetail(verification_id=verification_id,similarity=payload.get("similarity",0.0),
        matched=payload.get("matched",False),threshold=payload.get("threshold",.60),
        timestamp=payload.get("timestamp",""),
        source_quality=FaceQualitySchema(**payload["source_quality"]) if payload.get("source_quality") else None,
        target_quality=FaceQualitySchema(**payload["target_quality"]) if payload.get("target_quality") else None,payload=payload)

@app.post("/api/v1/events/recognize")
async def recognize_camera_event(image: UploadFile=File(...), camera_id: str=Form(...),
                                 tenant_id: str=Form("default"), threshold: float|None=Form(None)):
    image_bytes=await image.read()
    if not image_bytes: raise HTTPException(400,"Image file cannot be empty")
    try:
        event,details=await recognition_event_pipeline.process(image_bytes,camera_id=camera_id,tenant_id=tenant_id,
            threshold=threshold if threshold is not None else settings.default_match_threshold)
    except ValueError as exc: raise HTTPException(422,str(exc))
    except Exception as exc: raise HTTPException(502,f"Recognition pipeline failed: {exc}")
    return {"event":event.model_dump(mode="json"),"details":details}

@app.post("/api/v1/core/identities/enroll")
async def enroll_core_identity(image: UploadFile=File(...),identity_id: str=Form(...),
                               tenant_id: str=Form("default"),metadata: str|None=Form(None)):
    image_bytes=await image.read()
    if not image_bytes: raise HTTPException(400,"Image file cannot be empty")
    metadata_dict={}
    if metadata:
        try: metadata_dict=json.loads(metadata)
        except json.JSONDecodeError: raise HTTPException(400,"Invalid JSON format for metadata")
    try: return await identity_service.enroll(image_bytes,identity_id,tenant_id=tenant_id,metadata=metadata_dict)
    except ValueError as exc: raise HTTPException(422,str(exc))
    except Exception as exc: raise HTTPException(502,f"Core enrollment failed: {exc}")

@app.get("/api/v1/cameras")
async def list_cameras(tenant_id: str="default"):
    if not persistence: return []
    rows=await persistence.list_cameras(tenant_id)
    for row in rows:
        row.pop("source_uri", None)
        row["runtime"]=camera_manager.status(str(row["id"]))
    return rows

@app.post("/api/v1/cameras")
async def create_camera(payload: dict):
    if not persistence: raise HTTPException(503,"Supabase persistence is not configured")
    tenant=await persistence.resolve_tenant(str(payload.get("tenant_id","default")))
    source_type=str(payload.get("source_type","phone"))
    if source_type not in {"phone","rtsp","webcam"}: raise HTTPException(400,"source_type must be phone, rtsp or webcam")
    source_uri=payload.get("source_uri")
    if source_type=="rtsp" and not source_uri: raise HTTPException(422,"RTSP camera requires source_uri")
    if source_type=="webcam" and source_uri is None: source_uri="0"
    row={"tenant_id":tenant,"name":str(payload.get("name") or "Camera"),"source_type":source_type,
         "source_uri":source_uri,"zone":payload.get("zone"),"enabled":bool(payload.get("enabled",True)),
         "metadata":payload.get("metadata") or {}}
    result=await (await persistence._db()).table("cameras").insert(row).execute()
    if not result.data: raise HTTPException(502,"Failed to create camera")
    created=result.data[0]
    created.pop("source_uri", None)
    return created

@app.get("/api/v1/cameras/{camera_id}")
async def get_camera(camera_id: str, tenant_id: str="default"):
    if not persistence: raise HTTPException(503,"Supabase persistence is not configured")
    row=await persistence.get_camera(tenant_id,camera_id)
    if not row: raise HTTPException(404,"Camera not found")
    row.pop("source_uri",None)
    row["runtime"]=camera_manager.status(camera_id)
    return row

@app.patch("/api/v1/cameras/{camera_id}")
async def update_camera(camera_id: str, payload: dict):
    if not persistence: raise HTTPException(503,"Supabase persistence is not configured")
    tenant_id=str(payload.get("tenant_id","default"))
    source_type=payload.get("source_type")
    if source_type is not None and source_type not in {"phone","rtsp","webcam"}:
        raise HTTPException(400,"source_type must be phone, rtsp or webcam")
    if source_type=="rtsp" and not payload.get("source_uri"):
        raise HTTPException(422,"RTSP camera requires source_uri")
    await camera_manager.stop(camera_id)
    row=await persistence.update_camera(tenant_id,camera_id,payload)
    if not row: raise HTTPException(404,"Camera not found")
    row.pop("source_uri",None)
    return row

@app.delete("/api/v1/cameras/{camera_id}")
async def delete_camera(camera_id: str, tenant_id: str="default"):
    if not persistence: raise HTTPException(503,"Supabase persistence is not configured")
    await camera_manager.stop(camera_id)
    if not await persistence.delete_camera(tenant_id,camera_id): raise HTTPException(404,"Camera not found")
    return {"camera_id":camera_id,"deleted":True}

@app.get("/api/v1/cameras/{camera_id}/status")
async def camera_status(camera_id: str):
    return camera_manager.status(camera_id)

@app.get("/api/v1/cameras/{camera_id}/stream")
async def camera_stream(camera_id: str):
    return StreamingResponse(camera_manager.stream(camera_id),media_type="multipart/x-mixed-replace; boundary=frame")

@app.post("/api/v1/cameras/{camera_id}/frames")
async def ingest_camera_frame(camera_id: str, frame: UploadFile=File(...), tenant_id: str=Form("default")):
    data=await frame.read()
    if not data: raise HTTPException(400,"Empty frame")
    return await camera_manager.ingest(camera_id,data,"phone",tenant_id,True)

@app.post("/api/v1/cameras/{camera_id}/start")
async def start_camera(camera_id: str, payload: dict|None=None):
    if not persistence: raise HTTPException(503,"Supabase persistence is not configured")
    tenant_ref=str((payload or {}).get("tenant_id","default"))
    row=await persistence.get_camera(tenant_ref,camera_id)
    if not row: raise HTTPException(404,"Camera not found")
    if not row.get("enabled"): raise HTTPException(409,"Camera is disabled")
    if row["source_type"]=="rtsp":
        if not row.get("source_uri"): raise HTTPException(422,"RTSP camera has no source_uri")
        return await camera_manager.start_opencv(camera_id,row["source_uri"],tenant_ref)
    if row["source_type"]=="webcam":
        try: device=int((row.get("source_uri") or "0").replace("webcam:",""))
        except ValueError: raise HTTPException(422,"Webcam source_uri must be an integer device index")
        return await camera_manager.start_opencv(camera_id,device,tenant_ref)
    return {"camera_id":camera_id,"mode":"phone","message":"Open /camera/phone?camera_id="+camera_id+"&tenant_id="+tenant_ref}

@app.post("/api/v1/cameras/{camera_id}/stop")
async def stop_camera(camera_id: str):
    return await camera_manager.stop(camera_id)

@app.get("/api/v1/events/stream")
async def stream_vision_events(tenant_id: str="default", camera_id: str|None=None):
    async def generator():
        seen_ids: set[str] = set()
        while True:
            try:
                rows = await persistence.list_events(tenant_id, camera_id, 10) if persistence else []
                rows = list(reversed(rows))
                for row in rows:
                    row_id = str(row.get("id"))
                    if row_id not in seen_ids:
                        seen_ids.add(row_id)
                        payload = json.dumps(row, default=str)
                        yield f"data: {payload}\\n\\n"
                if len(seen_ids) > 200:
                    seen_ids = {str(row.get("id")) for row in rows}
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                yield f"event: error\\ndata: {json.dumps({\"error\": str(exc)})}\\n\\n"
                await asyncio.sleep(2)
    return StreamingResponse(generator(), media_type="text/event-stream", headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@app.get("/api/v1/events")
async def list_vision_events(tenant_id: str="default", camera_id: str|None=None, limit: int=50):
    if not persistence: return []
    limit=max(1,min(limit,200))
    return await persistence.list_events(tenant_id,camera_id,limit)
