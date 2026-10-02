import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { ClipboardClock, Download, UserRound } from "lucide-react";

export default async function AttendancePage(){
  const context=await requireWorkspace();
  if(!context.tenant || !context.membership) return <div className="page-wrap"><h1>Présences</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const today=new Date().toISOString().slice(0,10);
  const [sessions,people]=await withTimeout(Promise.all([
    s.from("attendance_sessions").select("id,identity_id,work_date,first_seen_at,last_seen_at,status,camera_id,metadata").eq("tenant_id",context.tenant.id).gte("work_date",today).order("first_seen_at",{ascending:false}).limit(100),
    s.from("identities").select("id,display_name,external_id,metadata").eq("tenant_id",context.tenant.id)
  ]),7000);
  const map=new Map((people.data||[]).map((p:any)=>[p.id,p]));
  return (
    <div className="page-wrap">
      <div className="page-title"><div><div className="eyebrow">Workforce intelligence</div><h1>Présences</h1><p>Sessions alimentées par les événements de vision. La première identification ouvre la journée ; les apparitions suivantes prolongent la session.</p></div><button className="btn btn-secondary"><Download size={15}/> Exporter</button></div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-top"><ClipboardClock size={17}/><span>Jour</span></div><div className="kpi-value">{sessions.data?.length||0}</div><div className="kpi-label">Présents détectés</div></div>
        <div className="kpi-card"><div className="kpi-top"><UserRound size={17}/><span>Annuaire</span></div><div className="kpi-value">{people.data?.length||0}</div><div className="kpi-label">Identités actives</div></div>
      </div>
      <div className="panel section-card">
        <table className="table"><thead><tr><th>Personne</th><th>Arrivée</th><th>Dernière présence</th><th>Durée observée</th><th>Statut</th></tr></thead><tbody>
        {(sessions.data||[]).map((s:any)=>{const p=map.get(s.identity_id);const a=new Date(s.first_seen_at);const b=new Date(s.last_seen_at);const mins=Math.max(0,Math.round((b.getTime()-a.getTime())/60000));return <tr key={s.id}><td><strong>{p?.display_name||String(s.identity_id).slice(0,8)}</strong><div className="muted" style={{fontSize:10}}>{p?.external_id||""}</div></td><td>{a.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</td><td>{b.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</td><td>{mins<60?mins+" min":Math.floor(mins/60)+" h "+(mins%60)+" min"}</td><td><span className="badge badge-success">{s.status}</span></td></tr>})}
        </tbody></table>
        {!sessions.data?.length && <div className="empty-state"><ClipboardClock size={26}/><strong>Aucune présence aujourd’hui</strong><p>Utilisez « Tester le flux » sur le tableau de bord pour valider le parcours sans moteur IA.</p></div>}
      </div>
    </div>
  );
}
