import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "../../../../lib/supabase-admin";

export async function POST(req:Request) {
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token) return NextResponse.json({error:"Token manquant."},{status:401});
  const hash=createHash("sha256").update(token).digest("hex");
  const db=createAdminClient();
  const now=new Date().toISOString();
  const {data,error}=await db.from("edge_agents").update({status:"online",last_seen_at:now,version:req.headers.get("x-agent-version")||undefined}).eq("token_hash",hash).select("id,tenant_id,status,last_seen_at").maybeSingle();
  if(error||!data) return NextResponse.json({error:"Agent inconnu."},{status:401});
  return NextResponse.json({ok:true,agent_id:data.id,status:data.status,last_seen_at:data.last_seen_at});
}
