import { NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase-server";
import { getApiContext } from "../../../../lib/api-auth";
import { writeAudit } from "../../../../lib/audit";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const body=await req.json();
  const status=String(body.review_status||"");
  if(!["pending","approved","rejected"].includes(status)) return NextResponse.json({error:"Statut de revue invalide."},{status:400});

  const s=await createServerClient();
  const {data,error}=await s.from("learning_examples").update({
    review_status:status,
    feedback:{...(body.feedback||{}),reviewed_by:auth.context.user.id,reviewed_at:new Date().toISOString()}
  }).eq("id",id).eq("tenant_id",auth.context.tenant!.id).select().single();

  if(error) return NextResponse.json({error:error.message},{status:400});
  await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"learning."+status,resourceType:"learning_example",resourceId:id});
  return NextResponse.json({data});
}
