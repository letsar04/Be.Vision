import { NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase-server";
import { getApiContext } from "../../../../lib/api-auth";
import { writeAudit } from "../../../../lib/audit";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const body=await req.json();
  const patch:any={};
  for(const key of ["name","source_type","source_uri","zone","site_id","enabled","metadata"]) if(key in body) patch[key]=body[key];

  const s=await createServerClient();
  const {data,error}=await s.from("cameras").update(patch).eq("id",id).eq("tenant_id",auth.context.tenant!.id).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"camera.updated",resourceType:"camera",resourceId:id,metadata:{fields:Object.keys(patch)}});
  return NextResponse.json({data});
}

export async function DELETE(_req:Request,{params}:{params:Promise<{id:string}>}) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const s=await createServerClient();
  const {error}=await s.from("cameras").delete().eq("id",id).eq("tenant_id",auth.context.tenant!.id);
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"camera.deleted",resourceType:"camera",resourceId:id});
  return NextResponse.json({ok:true});
}
