import { NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase-server";
import { getApiContext } from "../../../../lib/api-auth";
import { evaluatePolicies } from "../../../../lib/policy-engine";

export async function POST() {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const s=await createServerClient();
  const tenantId=auth.context.tenant!.id;

  const [{data:camera},{data:identity}] = await Promise.all([
    s.from("cameras").select("id,name,zone").eq("tenant_id",tenantId).eq("enabled",true).limit(1).maybeSingle(),
    s.from("identities").select("id,display_name").eq("tenant_id",tenantId).eq("status","active").limit(1).maybeSingle()
  ]);

  if(!camera) return NextResponse.json({error:"Ajoutez d’abord une caméra active."},{status:400});
  if(!identity) return NextResponse.json({error:"Ajoutez d’abord une personne."},{status:400});

  const now=new Date();
  const date=now.toISOString().slice(0,10);
  const {data:event,error:eventError}=await s.from("vision_events").insert({
    tenant_id:tenantId,type:"face_recognized",occurred_at:now.toISOString(),camera_id:camera.id,subject_id:identity.id,
    confidence:0.97,signals:{liveness:"demo"},metadata:{zone:camera.zone||"Entrée",demo:true,source:"test-lab"}
  }).select().single();
  if(eventError) return NextResponse.json({error:eventError.message},{status:500});

  const {data:session}=await s.from("attendance_sessions").select("id").eq("tenant_id",tenantId).eq("identity_id",identity.id).eq("work_date",date).maybeSingle();
  if(!session) {
    const {data:created}=await s.from("attendance_sessions").insert({
      tenant_id:tenantId,identity_id:identity.id,work_date:date,first_seen_at:now.toISOString(),last_seen_at:now.toISOString(),camera_id:camera.id,status:"present",metadata:{source:"test-lab"}
    }).select("id").single();
    if(created) await s.from("attendance_events").insert({tenant_id:tenantId,attendance_session_id:created.id,vision_event_id:event.id,event_type:"arrival",occurred_at:now.toISOString(),camera_id:camera.id,metadata:{demo:true}});
  } else {
    await s.from("attendance_sessions").update({last_seen_at:now.toISOString(),camera_id:camera.id,status:"present",updated_at:now.toISOString()}).eq("id",session.id);
    await s.from("attendance_events").insert({tenant_id:tenantId,attendance_session_id:session.id,vision_event_id:event.id,event_type:"presence",occurred_at:now.toISOString(),camera_id:camera.id,metadata:{demo:true}});
  }

  await evaluatePolicies(s,event);
  return NextResponse.json({ok:true,event_id:event.id,person:identity.display_name,confidence:event.confidence});
}
