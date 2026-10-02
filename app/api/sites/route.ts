import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { getApiContext } from "../../../lib/api-auth";
import { writeAudit } from "../../../lib/audit";

export async function GET(){
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const s=await createServerClient();
  const {data}=await s.from("sites").select("id,name,address,timezone,status,created_at").eq("tenant_id",auth.context.tenant!.id).order("name");
  return NextResponse.json({data:data||[]});
}

export async function POST(req:Request){
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const body=await req.json();
  const name=String(body.name||"").trim();
  if(!name) return NextResponse.json({error:"Le nom du site est obligatoire."},{status:400});
  const s=await createServerClient();
  const {data,error}=await s.from("sites").insert({
    tenant_id:auth.context.tenant!.id,
    name,
    address:body.address?String(body.address).trim():null,
    timezone:body.timezone?String(body.timezone):"Africa/Ouagadougou",
    status:"active"
  }).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"site.created",resourceType:"site",resourceId:data.id});
  return NextResponse.json({data},{status:201});
}
