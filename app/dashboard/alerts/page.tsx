import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { PolicyManager } from "../../../components/PolicyManager";

export default async function AlertsPage(){
  const context=await requireWorkspace();
  if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>Règles & alertes</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const q=await withTimeout(s.from("policies").select("id,name,enabled,definition,created_at,updated_at").eq("tenant_id",context.tenant.id).order("name"),7000);
  return <div className="page-wrap"><PolicyManager initialPolicies={q.data||[]}/></div>;
}
