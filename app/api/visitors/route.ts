import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createServerClient } from "../../../lib/supabase-server";
import { getApiContext } from "../../../lib/api-auth";
import { writeAudit } from "../../../lib/audit";

export async function GET(){
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const s=await createServerClient();
  const {data}=await s.from("visitors").select("id,full_name,company,phone,email,status,notes,created_at").eq("tenant_id",auth.context.tenant!.id).order("created_at",{ascending:false});
  return NextResponse.json({data:data||[]});
}

export async function POST(req:Request){
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const body=await req.json();
  const fullName=String(body.full_name||"").trim();
  if(!fullName) return NextResponse.json({error:"Le nom du visiteur est obligatoire."},{status:400});
  const s=await createServerClient();
  const {data:visitor,error}=await s.from("visitors").insert({
    tenant_id:auth.context.tenant!.id,
    full_name:fullName,
    company:body.company?String(body.company).trim():null,
    phone:body.phone?String(body.phone).trim():null,
    email:body.email?String(body.email).trim():null,
    notes:body.notes?String(body.notes).trim():null
  }).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  const {data:site}=body.site_id?await s.from("sites").select("id").eq("id",body.site_id).eq("tenant_id",auth.context.tenant!.id).maybeSingle():{data:null};
  const code="VIS-"+randomBytes(4).toString("hex").toUpperCase();
  const {data:visit,error:visitError}=await s.from("visitor_visits").insert({
    tenant_id:auth.context.tenant!.id,
    visitor_id:visitor.id,
    site_id:site?.id||null,
    host_name:body.host_name?String(body.host_name).trim():null,
    purpose:body.purpose?String(body.purpose).trim():null,
    access_zone:body.access_zone?String(body.access_zone).trim():null,
    scheduled_at:body.scheduled_at||null,
    status:"scheduled",
    pass_code:code,
    metadata:{created_from:"web"}
  }).select().single();
  if(visitError) return NextResponse.json({error:visitError.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"visitor.created",resourceType:"visitor",resourceId:visitor.id});
  return NextResponse.json({visitor,visit},{status:201});
}
