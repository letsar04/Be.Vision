import { NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/supabase-server";
import { getApiContext } from "../../../../../lib/api-auth";
import { writeAudit } from "../../../../../lib/audit";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const body=await req.json();
  const status=String(body.status||"");
  if(!["scheduled","checked_in","checked_out","canceled","denied"].includes(status)) return NextResponse.json({error:"Statut invalide."},{status:400});
  const patch:any={status};
  if(status==="checked_in") patch.checked_in_at=new Date().toISOString();
  if(status==="checked_out") patch.checked_out_at=new Date().toISOString();
  const s=await createServerClient();
  const {data,error}=await s.from("visitor_visits").update(patch).eq("id",id).eq("tenant_id",auth.context.tenant!.id).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"visitor_visit."+status,resourceType:"visitor_visit",resourceId:id});
  return NextResponse.json({data});
}
