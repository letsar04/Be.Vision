import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";
import { createAdminClient } from "../../../../lib/supabase-admin";
import { getApiContext } from "../../../../lib/api-auth";
import { writeAudit } from "../../../../lib/audit";

export async function GET() {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const db=createAdminClient();
  const {data}=await db.from("edge_agents").select("id,name,status,version,last_seen_at,created_at,metadata").eq("tenant_id",auth.context.tenant!.id).order("created_at",{ascending:false});
  return NextResponse.json({data:data||[]});
}

export async function POST(req:Request) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const body=await req.json().catch(()=>({}));
  const name=String(body.name||"Agent de site").trim();
  const token="bv_live_"+randomBytes(32).toString("hex");
  const tokenHash=createHash("sha256").update(token).digest("hex");
  const db=createAdminClient();
  const {data,error}=await db.from("edge_agents").insert({
    tenant_id:auth.context.tenant!.id,name,status:"pending",token_hash:tokenHash,version:null,metadata:{protocol:"https",heartbeat_seconds:30}
  }).select("id,name,status,created_at").single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(db,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"edge_agent.created",resourceType:"edge_agent",resourceId:data.id});
  return NextResponse.json({data,token},{status:201});
}
