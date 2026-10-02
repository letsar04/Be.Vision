import { NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/supabase-server";
import { getApiContext } from "../../../../../lib/api-auth";
import { writeAudit } from "../../../../../lib/audit";
import { withTimeout } from "../../../../../lib/workspace";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const facecompare=process.env.FACECOMPARE_API_URL;
  if(!facecompare) return NextResponse.json({error:"Le moteur de vision n'est pas configuré sur cet environnement."},{status:503});

  const {id}=await params;
  const incoming=await req.formData();
  const image=incoming.get("image");
  if(!(image instanceof File)) return NextResponse.json({error:"Image manquante."},{status:400});
  if(image.size>8_000_000) return NextResponse.json({error:"Image trop volumineuse (8 Mo maximum)."} ,{status:400});

  const s=await createServerClient();
  const {data:identity,error:identityError}=await s.from("identities").select("id,display_name,external_id,metadata").eq("id",id).eq("tenant_id",auth.context.tenant!.id).single();
  if(identityError||!identity) return NextResponse.json({error:"Personne introuvable."},{status:404});

  const fd=new FormData();
  fd.append("image",image,image.name);
  fd.append("person_id",identity.id);
  fd.append("name",identity.display_name);
  if(identity.external_id) fd.append("external_id",identity.external_id);
  fd.append("tenant_id",auth.context.tenant!.id);
  fd.append("metadata",JSON.stringify(identity.metadata||{}));

  try {
    const response=await withTimeout(fetch(facecompare.replace(/\/$/,"")+"/api/v1/enroll",{method:"POST",body:fd,signal:AbortSignal.timeout(25000)}),27000);
    const body=await response.json().catch(()=>({}));
    if(!response.ok) return NextResponse.json({error:body.detail||body.error||"Enrôlement refusé par le moteur de vision."},{status:502});

    const {data:enrollment,error:enrollError}=await s.from("identity_enrollments").insert({
      tenant_id:auth.context.tenant!.id,
      identity_id:id,
      model:"insightface",
      model_version:"current",
      vector_ref:body.vector_id||null,
      quality:null,
      metadata:{embedding_dim:body.embedding_dim||null,source:"bevision"}
    }).select().single();

    if(enrollError) throw enrollError;

    await writeAudit(s,{tenantId:auth.context.tenant!.id,actorUserId:auth.context.user.id,action:"identity.enrolled",resourceType:"identity",resourceId:id,metadata:{vector_id:body.vector_id||null}});
    return NextResponse.json({ok:true,enrollment,engine:body});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Le moteur de vision ne répond pas."},{status:504});
  }
}
