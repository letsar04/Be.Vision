import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { getApiContext } from "../../../lib/api-auth";
import { writeAudit } from "../../../lib/audit";

const allowed = new Set(["rtsp","webcam","phone"]);

export async function GET() {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const s=await createServerClient();
  const {data}=await s.from("cameras").select("id,name,source_type,source_uri,zone,enabled,site_id,metadata,created_at").eq("tenant_id",auth.context.tenant!.id).order("created_at",{ascending:false});
  return NextResponse.json({data:data||[]});
}

export async function POST(req:Request) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});

  try {
    const body=await req.json();
    const name=String(body.name||"").trim();
    const sourceType=String(body.source_type||"rtsp");
    const sourceUri=body.source_uri ? String(body.source_uri).trim() : null;
    const zone=body.zone ? String(body.zone).trim() : null;
    if(!name) return NextResponse.json({error:"Le nom de la caméra est obligatoire."},{status:400});
    if(!allowed.has(sourceType)) return NextResponse.json({error:"Type de source invalide."},{status:400});

    const s=await createServerClient();
    if(body.site_id){
      const {data:site}=await s.from("sites").select("id").eq("id",body.site_id).eq("tenant_id",auth.context.tenant!.id).maybeSingle();
      if(!site) return NextResponse.json({error:"Site invalide."},{status:400});
    }

    const {data,error}=await s.from("cameras").insert({
      tenant_id:auth.context.tenant!.id,name,source_type:sourceType,
      source_uri:sourceUri,zone,site_id:body.site_id||null,enabled:body.enabled!==false,
      metadata:{protocol:sourceType==="rtsp"?"RTSP / caméra IP":"mode test"}
    }).select().single();

    if(error) throw error;
    await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"camera.created",resourceType:"camera",resourceId:data.id,metadata:{source_type:sourceType}});
    return NextResponse.json({data},{status:201});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Création impossible."},{status:500});
  }
}
