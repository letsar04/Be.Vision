import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { History, ShieldCheck } from "lucide-react";

export default async function AuditPage(){
  const context=await requireWorkspace();
  if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>Audit</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const q=await withTimeout(s.from("audit_logs").select("id,action,actor_user_id,resource_type,resource_id,metadata,created_at").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false}).limit(150),7000);
  return <div className="page-wrap"><div className="page-title"><div><div className="eyebrow">Governance</div><h1>Journal d’audit</h1><p>Traçabilité des opérations administratives et décisions automatisées de l’espace.</p></div></div><div className="panel"><div className="panel-head"><div><h2>Événements d’administration</h2><span>{q.data?.length||0} entrées</span></div><ShieldCheck size={17}/></div><table className="table"><thead><tr><th>Action</th><th>Ressource</th><th>Moment</th><th>Acteur</th></tr></thead><tbody>{(q.data||[]).map((e:any)=><tr key={e.id}><td><strong>{e.action}</strong></td><td className="muted">{e.resource_type||"—"} {e.resource_id?String(e.resource_id).slice(0,8):""}</td><td>{new Date(e.created_at).toLocaleString("fr-FR")}</td><td className="muted">{e.actor_user_id?String(e.actor_user_id).slice(0,8):"système"}</td></tr>)}</tbody></table>{!q.data?.length&&<div className="empty-state"><History size={28}/><strong>Aucun audit</strong><p>Les prochaines créations et modifications apparaîtront ici.</p></div>}</div></div>
}
