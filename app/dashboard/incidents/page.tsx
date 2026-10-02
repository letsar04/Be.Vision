import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { IncidentManager } from "../../../components/IncidentManager";

export default async function IncidentsPage(){
  const context=await requireWorkspace();
  if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>Incidents</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const q=await withTimeout(s.from("incidents").select("id,title,severity,status,created_at,updated_at,closed_at,metadata,event_id").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false}).limit(100),7000);
  return <div className="page-wrap"><IncidentManager initialIncidents={q.data||[]}/></div>;
}
