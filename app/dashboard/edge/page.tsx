import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { EdgeManager } from "../../../components/EdgeManager";

export default async function EdgePage(){
  const context=await requireWorkspace();
  if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>Agents de site</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const db=await createServerClient();
  const q=await withTimeout(db.from("edge_agents").select("id,name,status,version,last_seen_at,created_at,metadata").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false}),7000);
  return <div className="page-wrap"><EdgeManager initialAgents={q.data||[]}/></div>;
}
