"""Supabase PostgreSQL persistence for Be.Vision Core."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any
from supabase import AsyncClient, acreate_client

class SupabaseRepository:
    def __init__(self, url: str, key: str):
        self.url = url; self.key = key; self.client: AsyncClient | None = None

    async def connect(self):
        if self.client is None:
            self.client = await acreate_client(self.url, self.key)

    async def _db(self):
        await self.connect(); assert self.client is not None
        return self.client

    async def resolve_tenant(self, tenant_ref: str) -> str:
        db = await self._db()
        try:
            tenant_uuid = str(uuid.UUID(tenant_ref))
            row = await db.table("tenants").select("id").eq("id", tenant_uuid).single().execute()
        except ValueError:
            row = await db.table("tenants").select("id").eq("slug", tenant_ref).single().execute()
        if not row.data: raise ValueError(f"Tenant '{tenant_ref}' not found")
        return row.data["id"]

    async def ensure_identity(self, tenant_ref: str, identity_ref: str, metadata: dict[str, Any] | None = None) -> str:
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        existing = await db.table("identities").select("id").eq("tenant_id", tenant_id).eq("external_id", identity_ref).limit(1).execute()
        if existing.data: return existing.data[0]["id"]
        metadata = metadata or {}
        result = await db.table("identities").insert({"tenant_id": tenant_id, "external_id": identity_ref, "display_name": str(metadata.get("name") or identity_ref), "metadata": metadata}).execute()
        if not result.data: raise RuntimeError("Failed to create identity")
        return result.data[0]["id"]

    async def create_enrollment(self, tenant_ref: str, identity_ref: str, enrollment_id: str, model: str, model_version: str | None, quality: Any, metadata: dict[str, Any] | None = None):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref); identity_uuid = await self.ensure_identity(tenant_ref, identity_ref, metadata)
        result = await db.table("identity_enrollments").insert({"id": enrollment_id, "tenant_id": tenant_id, "identity_id": identity_uuid, "model": model, "model_version": model_version, "vector_ref": enrollment_id, "quality": quality.get("score") if isinstance(quality, dict) else quality, "metadata": metadata or {}}).execute()
        if not result.data: raise RuntimeError("Failed to persist enrollment")
        return result.data[0]

    async def create_vision_event(self, event: dict[str, Any]):
        db = await self._db(); tenant_id = await self.resolve_tenant(str(event.get("metadata", {}).get("tenant_id", "default")))
        camera_uuid = None
        if event.get("camera_id"):
            try:
                camera_uuid = str(uuid.UUID(str(event["camera_id"])))
                camera = await db.table("cameras").select("id").eq("id", camera_uuid).eq("tenant_id", tenant_id).limit(1).execute()
                if not camera.data: camera_uuid = None
            except ValueError: camera_uuid = None
        subject_uuid = None
        if event.get("subject_id"):
            existing = await db.table("identities").select("id").eq("tenant_id", tenant_id).eq("external_id", str(event["subject_id"])).limit(1).execute()
            if existing.data: subject_uuid = existing.data[0]["id"]
        result = await db.table("vision_events").insert({"tenant_id": tenant_id, "type": event["type"], "occurred_at": event["occurred_at"], "camera_id": camera_uuid, "subject_id": subject_uuid, "confidence": event.get("confidence"), "signals": event.get("signals", {}), "model": event.get("model"), "model_version": event.get("model_version"), "metadata": event.get("metadata", {})}).execute()
        if not result.data: raise RuntimeError("Failed to persist vision event")
        return result.data[0]

    async def list_cameras(self, tenant_ref: str):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        result = await db.table("cameras").select("id,name,source_type,source_uri,zone,enabled,metadata,created_at").eq("tenant_id", tenant_id).order("created_at").execute()
        return result.data or []

    async def get_camera(self, tenant_ref: str, camera_id: str):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        result = await db.table("cameras").select("id,name,source_type,source_uri,zone,enabled,metadata,created_at").eq("tenant_id", tenant_id).eq("id", camera_id).limit(1).execute()
        return result.data[0] if result.data else None

    async def update_camera(self, tenant_ref: str, camera_id: str, values: dict[str, Any]):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        allowed = {k: v for k, v in values.items() if k in {"name","source_type","source_uri","zone","enabled","metadata"}}
        if not allowed: return await self.get_camera(tenant_ref, camera_id)
        result = await db.table("cameras").update(allowed).eq("tenant_id", tenant_id).eq("id", camera_id).execute()
        return result.data[0] if result.data else None

    async def delete_camera(self, tenant_ref: str, camera_id: str):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        result = await db.table("cameras").delete().eq("tenant_id", tenant_id).eq("id", camera_id).execute()
        return bool(result.data)

    async def list_events(self, tenant_ref: str, camera_id: str | None = None, limit: int = 50):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        query = db.table("vision_events").select("id,type,occurred_at,camera_id,subject_id,confidence,signals,model,model_version,metadata").eq("tenant_id", tenant_id).order("occurred_at", desc=True).limit(limit)
        if camera_id: query = query.eq("camera_id", camera_id)
        result = await query.execute()
        return result.data or []

    async def list_policies(self, tenant_ref: str):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        result = await db.table("policies").select("id,name,enabled,definition,created_at,updated_at").eq("tenant_id", tenant_id).order("created_at").execute()
        return result.data or []

    async def create_policy_evaluation(self, tenant_ref: str, policy_id: str, event_id: str | None, evaluation: dict[str, Any]):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        row = {"tenant_id": tenant_id, "policy_id": policy_id, "event_id": event_id, "matched": bool(evaluation.get("matched")), "reasons": evaluation.get("reasons", []), "metadata": evaluation}
        result = await db.table("policy_evaluations").insert(row).execute()
        return result.data[0] if result.data else row

    async def create_action(self, tenant_ref: str, action_type: str, payload: dict[str, Any], event_id: str | None = None):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        event_uuid = None
        if event_id:
            try: event_uuid = str(uuid.UUID(str(event_id)))
            except ValueError: pass
        result = await db.table("actions").insert({"tenant_id": tenant_id, "event_id": event_uuid, "action_type": action_type, "payload": payload}).execute()
        return result.data[0] if result.data else None

    async def record_attendance_presence(self, tenant_ref: str, identity_ref: str, occurred_at: datetime, camera_ref: str | None = None, vision_event_id: str | None = None):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        identity_id = await self.ensure_identity(tenant_ref, identity_ref)
        camera_id = None
        if camera_ref:
            try:
                camera_id = str(uuid.UUID(str(camera_ref)))
                check = await db.table("cameras").select("id").eq("id", camera_id).eq("tenant_id", tenant_id).limit(1).execute()
                if not check.data: camera_id = None
            except ValueError: camera_id = None
        work_date = occurred_at.date().isoformat()
        existing = await db.table("attendance_sessions").select("*").eq("tenant_id", tenant_id).eq("identity_id", identity_id).eq("work_date", work_date).limit(1).execute()
        if existing.data:
            session = existing.data[0]
            first_seen = session["first_seen_at"]
            await db.table("attendance_sessions").update({"last_seen_at": occurred_at.isoformat(), "camera_id": camera_id, "updated_at": datetime.now().astimezone().isoformat()}).eq("id", session["id"]).execute()
            event_type = "presence"
        else:
            result = await db.table("attendance_sessions").insert({"tenant_id": tenant_id, "identity_id": identity_id, "work_date": work_date, "first_seen_at": occurred_at.isoformat(), "last_seen_at": occurred_at.isoformat(), "camera_id": camera_id}).execute()
            if not result.data: raise RuntimeError("Failed to create attendance session")
            session = result.data[0]; first_seen = session["first_seen_at"]; event_type = "arrival"
        event_uuid = None
        if vision_event_id:
            try: event_uuid = str(uuid.UUID(str(vision_event_id)))
            except ValueError: pass
        result = await db.table("attendance_events").insert({"tenant_id": tenant_id, "attendance_session_id": session["id"], "vision_event_id": event_uuid, "event_type": event_type, "occurred_at": occurred_at.isoformat(), "camera_id": camera_id}).execute()
        return {"session": session, "event_type": event_type, "first_seen_at": first_seen, "attendance_event": result.data[0] if result.data else None}

    async def list_attendance(self, tenant_ref: str, work_date: str | None = None, limit: int = 200):
        db = await self._db(); tenant_id = await self.resolve_tenant(tenant_ref)
        query = db.table("attendance_sessions").select("id,identity_id,work_date,first_seen_at,last_seen_at,status,camera_id,metadata").eq("tenant_id", tenant_id).order("work_date", desc=True).limit(limit)
        if work_date: query = query.eq("work_date", work_date)
        result = await query.execute()
        return result.data or []
