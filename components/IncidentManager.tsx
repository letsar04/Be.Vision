"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert } from "lucide-react";

export function IncidentManager({initialIncidents}:{initialIncidents:any[]}){
  const [items,setItems]=useState(initialIncidents);
  const [filter,setFilter]=useState("all");

  async function update(id:string,status:string){
    const r=await fetch("/api/incidents/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    if(r.ok)setItems(items.map(x=>x.id===id?{...x,status}:x));
  }

  const filtered=filter==="all"?items:items.filter(x=>x.status===filter);

  return <div>
    <div className="page-title"><div><div className="eyebrow">Incident response</div><h1>Incidents</h1><p>Une file de traitement pour les alertes qui nécessitent une décision humaine.</p></div><select value={filter} onChange={e=>setFilter(e.target.value)} style={{border:"1px solid var(--line)",background:"#0d1b24",color:"var(--text)",borderRadius:10,padding:"10px 12px"}}><option value="all">Tous</option><option value="open">Ouverts</option><option value="acknowledged">Pris en compte</option><option value="resolved">Résolus</option></select></div>
    <div style={{display:"grid",gap:10}}>
      {filtered.map(item=><div className="incident-card" key={item.id}><div className="incident-icon"><AlertTriangle size={18}/></div><div className="incident-body"><strong>{item.title}</strong><span>{String(item.severity).toUpperCase()} · {new Date(item.created_at).toLocaleString("fr-FR")} · {item.metadata?.event_type||"événement"}</span></div><span className={item.severity==="critical"?"badge badge-danger":item.severity==="high"?"badge badge-warning":"badge badge-neutral"}>{item.status}</span><div style={{display:"flex",gap:5}}>{item.status==="open"&&<button className="icon-btn" title="Prendre en compte" onClick={()=>void update(item.id,"acknowledged")}><Eye size={15}/></button>}{item.status!=="resolved"&&<button className="icon-btn" title="Résoudre" onClick={()=>void update(item.id,"resolved")}><CheckCircle2 size={15}/></button>}</div></div>)}
      {!filtered.length&&<div className="panel empty-state"><ShieldAlert size={28}/><strong>Pas d’incident</strong><p>La file de traitement est vide.</p></div>}
    </div>
  </div>
}
