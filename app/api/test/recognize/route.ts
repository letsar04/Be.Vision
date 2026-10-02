import { NextResponse } from "next/server";
import { getApiContext } from "../../../../lib/api-auth";
import { withTimeout } from "../../../../lib/workspace";

export async function POST(req:Request) {
  const auth=await getApiContext();
  if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status});
  const facecompare=process.env.FACECOMPARE_API_URL;
  if(!facecompare) return NextResponse.json({error:"Le moteur de vision n'est pas configuré. Utilisez d'abord le bouton de simulation métier ou connectez FaceCompare API."},{status:503});

  const incoming=await req.formData();
  const image=incoming.get("image");
  if(!(image instanceof File)) return NextResponse.json({error:"Image manquante."},{status:400});

  const fd=new FormData();
  fd.append("image",image,image.name);
  fd.append("tenant_id",auth.context.tenant!.id);

  try {
    const response=await withTimeout(fetch(facecompare.replace(/\/$/,"")+"/api/v1/search",{method:"POST",body:fd,signal:AbortSignal.timeout(20000)}),22000);
    const body=await response.json().catch(()=>({}));
    return NextResponse.json(body,{status:response.ok?200:502});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Le moteur de vision est inaccessible."},{status:504});
  }
}
