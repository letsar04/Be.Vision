"""Supabase PostgreSQL persistence for Be.Vision Core."""
from __future__ import annotations
import uuid
from typing import Any
from supabase import AsyncClient, acreate_client

class SupabaseRepository:
    def __init__(self, url: str, key: str):
        self.url=url; self.key=key; self.client: AsyncClient|None=None
    async def connect(self):
        if self.client is None: self.client=await acreate_client(self.url,self.key)
    async def _db(self):
        await self.connect(); assert self.client is not None; return self.client
    async def resolve_tenant(self, tenant_ref: str)->str:
        db=await self._db()
        try:
            tenant_uuid=str(uuid.UUID(tenant_ref)); row=await db.table("tenants").select("id").eq("id",tenant_uuid).single().execute()
        except ValueError:
            row=await db.table("tenants").select("id").eq("slug",tenant_ref).single().execute()
        if not row.data: raise ValueError(f"Tenant '{tenant_ref}' not found")
        return row.data["id"]
    async def ensure_identity(self, tenant_ref:str, identity_ref:str, metadata:dict[str,Any]|None=None)->str:
        db=await self._db(); tenant_id=await self.resolve_tenant(tenant_ref)
        existing=await db.table("identities").select("id").eq("tenant_id",tenant_id).eq("external_id",identity_ref).limit(1).execute()
        if existing.data: return existing.data[0]["id"]
        metadata=metadata or {}
        result=await db.table("identities").insert({"tenant_id":tenant_id,"external_id":identity_ref,"display_name":str(metadata.get("name") or identity_ref),"metadata":metadata}).execute()
        if not result.data: raise RuntimeError("Failed to create identity")
        return result.data[0]["id"]
    async def create_enrollment(self,tenant_ref:str,identity_ref:str,enrollment_id:str,model:str,model_version:str|None,quality:Any,metadata:dict[str,Any]|None=None):
        db=await self._db(); tenant_id=await self.resolve_tenant(tenant_ref); identity_uuid=await self.ensure_identity(tenant_ref,identity_ref,metadata)
        result=await db.table("identity_enrollments").insert({"id":enrollment_id,"tenant_id":tenant_id,"identity_id":identity_uuid,"model":model,"model_version":model_version,"vector_ref":enrollment_id,"quality":quality.get("score") if isinstance(quality,dict) else quality,"metadata":metadata or {}}).execute()
        if not result.data: raise RuntimeError("Failed to persist enrollment")
        return result.data[0]
    async def create_vision_event(self,event:dict[str,Any]):
        db=await self._db()
        tenant_id=await self.resolve_tenant(str(event.get("metadata",{}).get("tenant_id","default")))
        camera_uuid=None
        camera_ref=event.get("camera_id")
        if camera_ref:
            try:
                camera_uuid=str(uuid.UUID(str(camera_ref)))
                camera=await db.table("cameras").select("id").eq("id",camera_uuid).eq("tenant_id",tenant_id).limit(1).execute()
                if not camera.data: camera_uuid=None
            except ValueError:
                camera_uuid=None
        subject_uuid=None
        subject_ref=event.get("subject_id")
        if subject_ref:
            existing=await db.table("identities").select("id").eq("tenant_id",tenant_id).eq("external_id",str(subject_ref)).limit(1).execute()
            if existing.data: subject_uuid=existing.data[0]["id"]
        result=await db.table("vision_events").insert({
            "tenant_id":tenant_id,"type":event["type"],"occurred_at":event["occurred_at"],
            "camera_id":camera_uuid,"subject_id":subject_uuid,"confidence":event.get("confidence"),
            "signals":event.get("signals",{}),"model":event.get("model"),
            "model_version":event.get("model_version"),"metadata":event.get("metadata",{})
        }).execute()
        if not result.data: raise RuntimeError("Failed to persist vision event")
        return result.data[0]
