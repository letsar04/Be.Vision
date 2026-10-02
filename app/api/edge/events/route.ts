import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "../../../../lib/supabase-admin";
import { evaluatePolicies } from "../../../../lib/policy-engine";

const types=["face_recognized","unknown_person","restricted_zone","after_hours","camera_offline","person_detected"];

export async function POST(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return NextResponse.json({error:"Token manquant."},{status:401});
  const hash=createHash("sha256").update(token).digest("hex");
  const db=createAdminClient();
  const {data:agent}=await db.from("edge_agents").select("id,tenant_id").eq("token_hash",hash).maybeSingle();
  if(!agent)return NextResponse.json({error:"Agent inconnu."},{status:401});

  try{
    const body=await req.json();
    const type=String(body.type||"");
    if(!types.includes(type))return NextResponse.json({error:"Type d’événement invalide."},{status:400});

    const cameraId=body.camera_id?String(body.camera_id):null;
    let cameraRole="presence";
    let cameraZone="";
    if(cameraId){
      const {data:camera}=await db.from("cameras").select("id,metadata,zone").eq("id",cameraId).eq("tenant_id",agent.tenant_id).maybeSingle();
      if(!camera)return NextResponse.json({error:"Caméra non rattachée à cet espace."},{status:400});
      cameraRole=String(camera.metadata?.role||"presence");
      cameraZone=String(camera.zone||"");
    }

    let subjectId=body.subject_id?String(body.subject_id):null;
    if(subjectId){
      const {data:identity}=await db.from("identities").select("id").eq("id",subjectId).eq("tenant_id",agent.tenant_id).maybeSingle();
      if(!identity)subjectId=null;
    }

    const occurredAt=body.occurred_at?new Date(body.occurred_at).toISOString():new Date().toISOString();
    const metadata={...(body.metadata||{}),edge_agent_id:agent.id,camera_role:cameraRole,zone:body.metadata?.zone||cameraZone};

    const {data:event,error}=await db.from("vision_events").insert({
      tenant_id:agent.tenant_id,type,occurred_at:occurredAt,camera_id:cameraId,subject_id:subjectId,
      confidence:body.confidence==null?null:Number(body.confidence),signals:body.signals||{},
      model:body.model||"insightface",model_version:body.model_version||null,metadata
    }).select().single();
    if(error)return NextResponse.json({error:error.message},{status:500});

    if(type==="face_recognized"&&subjectId){
      const date=occurredAt.slice(0,10);
      const {data:session}=await db.from("attendance_sessions").select("id").eq("tenant_id",agent.tenant_id).eq("identity_id",subjectId).eq("work_date",date).maybeSingle();

      if(cameraRole==="exit"){
        let sessionId=session?.id;
        if(!sessionId){
          const {data:created}=await db.from("attendance_sessions").insert({tenant_id:agent.tenant_id,identity_id:subjectId,work_date:date,first_seen_at:occurredAt,last_seen_at:occurredAt,status:"completed",camera_id:cameraId,metadata:{source:"edge",agent_id:agent.id}}).select("id").single();
          sessionId=created?.id;
        }else{
          await db.from("attendance_sessions").update({last_seen_at:occurredAt,status:"completed",camera_id:cameraId,updated_at:new Date().toISOString()}).eq("id",sessionId);
        }
        if(sessionId)await db.from("attendance_events").insert({tenant_id:agent.tenant_id,attendance_session_id:sessionId,vision_event_id:event.id,event_type:"departure",occurred_at:occurredAt,camera_id:cameraId,metadata:{source:"edge"}});
      }else if(!session){
        const {data:created}=await db.from("attendance_sessions").insert({tenant_id:agent.tenant_id,identity_id:subjectId,work_date:date,first_seen_at:occurredAt,last_seen_at:occurredAt,status:"present",camera_id:cameraId,metadata:{source:"edge",agent_id:agent.id}}).select("id").single();
        if(created)await db.from("attendance_events").insert({tenant_id:agent.tenant_id,attendance_session_id:created.id,vision_event_id:event.id,event_type:"arrival",occurred_at:occurredAt,camera_id:cameraId,metadata:{source:"edge"}});
      }else{
        await db.from("attendance_sessions").update({last_seen_at:occurredAt,status:"present",camera_id:cameraId,updated_at:new Date().toISOString()}).eq("id",session.id);
        await db.from("attendance_events").insert({tenant_id:agent.tenant_id,attendance_session_id:session.id,vision_event_id:event.id,event_type:"presence",occurred_at:occurredAt,camera_id:cameraId,metadata:{source:"edge"}});
      }
    }

    await db.from("edge_agents").update({status:"online",last_seen_at:new Date().toISOString()}).eq("id",agent.id);
    await evaluatePolicies(db,event);
    return NextResponse.json({ok:true,event_id:event.id});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Événement invalide."},{status:400});}
}
