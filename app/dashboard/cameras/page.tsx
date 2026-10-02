import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { CameraManager } from "../../../components/CameraManager";

export default async function CamerasPage(){
  const context=await requireWorkspace();
  if(!context.tenant || !context.membership) return <div className="page-wrap"><h1>Caméras</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const [cameras,sites]=await withTimeout(Promise.all([
    s.from("cameras").select("id,name,source_type,source_uri,zone,enabled,site_id,metadata,created_at").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false}),
    s.from("sites").select("id,name,address,status").eq("tenant_id",context.tenant.id).order("name")
  ]),7000);
  return <div className="page-wrap"><CameraManager initialCameras={cameras.data||[]} sites={sites.data||[]}/></div>;
}
