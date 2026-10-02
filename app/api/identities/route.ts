import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { getApiContext } from "../../../lib/api-auth";
import { writeAudit } from "../../../lib/audit";

export async function GET() {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const s=await createServerClient();
  const {data}=await s.from("identities").select("id,display_name,external_id,identity_type,status,metadata,created_at").eq("tenant_id",auth.context.tenant!.id).order("display_name");
  return NextResponse.json({data:data||[]});
}

export async function POST(req:Request) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});

  try {
    const body=await req.json();
    const displayName=String(body.display_name||"").trim();
    if(!displayName) return NextResponse.json({error:"Le nom de la personne est obligatoire."},{status:400});

    const metadata={
      department: body.department ? String(body.department).trim() : null,
      role: body.role ? String(body.role).trim() : null,
      consent_recorded: Boolean(body.consent_recorded),
      consent_at: body.consent_recorded ? new Date().toISOString() : null,
    };

    const s=await createServerClient();
    const {data,error}=await s.from("identities").insert({
      tenant_id:auth.context.tenant!.id,
      display_name:displayName,
      external_id:body.external_id?String(body.external_id).trim():null,
      identity_type:"person",
      status:"active",
      metadata
    }).select().single();

    if(error) throw error;
    await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"identity.created",resourceType:"identity",resourceId:data.id});
    return NextResponse.json({data},{status:201});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Création impossible."},{status:500});
  }
}
