import { NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase-server";
import { getApiContext } from "../../../../lib/api-auth";
import { writeAudit } from "../../../../lib/audit";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const body=await req.json();
  const patch:any={};
  for(const key of ["name","address","timezone","status"]) if(body[key]!=null) patch[key]=body[key];
  const s=await createServerClient();
  const {data,error}=await s.from("sites").update(patch).eq("id",id).eq("tenant_id",auth.context.tenant!.id).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"site.updated",resourceType:"site",resourceId:id});
  return NextResponse.json({data});
}
