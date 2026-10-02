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
  if(body.display_name!=null) patch.display_name=String(body.display_name).trim();
  if(body.external_id!=null) patch.external_id=String(body.external_id).trim();
  if(body.status!=null) patch.status=String(body.status);
  if(body.metadata!=null) patch.metadata=body.metadata;
  const s=await createServerClient();
  const {data,error}=await s.from("identities").update(patch).eq("id",id).eq("tenant_id",auth.context.tenant!.id).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"identity.updated",resourceType:"identity",resourceId:id});
  return NextResponse.json({data});
}

export async function DELETE(_req:Request,{params}:{params:Promise<{id:string}>}) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const s=await createServerClient();
  const {error}=await s.from("identities").delete().eq("id",id).eq("tenant_id",auth.context.tenant!.id);
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"identity.deleted",resourceType:"identity",resourceId:id});
  return NextResponse.json({ok:true});
}
