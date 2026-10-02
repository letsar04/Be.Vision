import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { getApiContext } from "../../../lib/api-auth";
import { writeAudit } from "../../../lib/audit";

export async function GET() {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const s=await createServerClient();
  const {data}=await s.from("policies").select("id,name,enabled,definition,created_at,updated_at").eq("tenant_id",auth.context.tenant!.id).order("name");
  return NextResponse.json({data:data||[]});
}

export async function POST(req:Request) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const body=await req.json();
  const name=String(body.name||"").trim();
  if(!name) return NextResponse.json({error:"Le nom de la règle est obligatoire."},{status:400});
  const s=await createServerClient();
  const {data,error}=await s.from("policies").insert({tenant_id:auth.context.tenant!.id,name,enabled:body.enabled!==false,definition:body.definition||{}}).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"policy.created",resourceType:"policy",resourceId:data.id});
  return NextResponse.json({data},{status:201});
}
