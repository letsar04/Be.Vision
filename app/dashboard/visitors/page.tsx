import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { VisitorManager } from "../../../components/VisitorManager";

export default async function VisitorsPage(){
  const context=await requireWorkspace();
  if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>Visiteurs</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const q=await withTimeout(Promise.all([
    s.from("visitors").select("id,full_name,company,phone,email,status,notes,created_at").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false}),
    s.from("visitor_visits").select("id,visitor_id,site_id,host_name,purpose,access_zone,scheduled_at,checked_in_at,checked_out_at,status,pass_code,created_at").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false})
  ]),7000);
  const visits=new Map((q[1].data||[]).map((v:any)=>[v.visitor_id,v]));
  const visitors=(q[0].data||[]).map((v:any)=>({...v,visit:visits.get(v.id)}));
  const sites=(await s.from("sites").select("id,name").eq("tenant_id",context.tenant.id).order("name")).data||[];
  return <div className="page-wrap"><VisitorManager initialVisitors={visitors} sites={sites}/></div>;
}
