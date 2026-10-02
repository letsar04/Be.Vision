import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { BarChart3, TrendingUp } from "lucide-react";

export default async function AnalyticsPage(){
  const context=await requireWorkspace();
  if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>Analytique</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const start=new Date();start.setDate(start.getDate()-13);start.setHours(0,0,0,0);
  const q=await withTimeout(Promise.all([
    s.from("attendance_sessions").select("work_date,id").eq("tenant_id",context.tenant.id).gte("work_date",start.toISOString().slice(0,10)),
    s.from("vision_events").select("type,occurred_at").eq("tenant_id",context.tenant.id).gte("occurred_at",start.toISOString()).order("occurred_at",{ascending:true})
  ]),7000);
  const counts=new Map<string,number>();
  for(const item of q[0].data||[]) counts.set(item.work_date,(counts.get(item.work_date)||0)+1);
  const days=[...Array(14)].map((_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d.toISOString().slice(0,10)});
  const max=Math.max(1,...days.map(d=>counts.get(d)||0));
  const byType=new Map<string,number>();
  for(const e of q[1].data||[]) byType.set(e.type,(byType.get(e.type)||0)+1);
  return <div className="page-wrap"><div className="page-title"><div><div className="eyebrow">Business intelligence</div><h1>Analytique</h1><p>Mesurez la présence, l’activité vidéo et les événements qui produisent des décisions.</p></div></div><div className="kpi-grid"><div className="kpi-card"><div className="kpi-top"><TrendingUp size={17}/><span>14 jours</span></div><div className="kpi-value">{q[0].data?.length||0}</div><div className="kpi-label">sessions de présence</div></div><div className="kpi-card"><div className="kpi-top"><BarChart3 size={17}/><span>14 jours</span></div><div className="kpi-value">{q[1].data?.length||0}</div><div className="kpi-label">événements vision</div></div></div><div className="panel section-card"><div className="panel-head"><div><h2>Présence par jour</h2><span>Sessions détectées</span></div></div><div className="chart-wrap">{days.map(d=><div className="chart-col" key={d}><div className="chart-value">{counts.get(d)||0}</div><div className="chart-bar" style={{height:Math.max(4,Math.round(((counts.get(d)||0)/max)*210))}}/><div className="chart-label">{d.slice(8)}/{d.slice(5,7)}</div></div>)}</div></div><div className="panel section-card"><div className="panel-head"><div><h2>Événements par type</h2><span>Sur la même période</span></div></div>{[...byType.entries()].sort((a,b)=>b[1]-a[1]).map(([type,count])=><div key={type} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"1px solid var(--line)"}}><span style={{flex:1,fontSize:12,textTransform:"capitalize"}}>{type.replaceAll("_"," ")}</span><strong>{count}</strong></div>)}{!byType.size&&<div className="empty-state">Aucun événement.</div>}</div></div>
}
