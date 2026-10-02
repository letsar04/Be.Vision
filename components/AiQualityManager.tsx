"use client";

import { useState } from "react";
import { CheckCircle2, Database, FlaskConical, RotateCcw, XCircle } from "lucide-react";

export function AiQualityManager({initialExamples,models,evaluations}:{initialExamples:any[];models:any[];evaluations:any[]}){
  const [examples,setExamples]=useState(initialExamples);
  async function review(id:string,status:string){
    const r=await fetch("/api/learning/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({review_status:status})});
    if(r.ok)setExamples(examples.map(e=>e.id===id?{...e,review_status:status}:e));
  }
  const pending=examples.filter(e=>e.review_status==="pending");
  return <div>
    <div className="page-title"><div><div className="eyebrow">AI governance</div><h1>IA & qualité</h1><p>Une boucle de revue humaine pour transformer les cas incertains en données d’amélioration sans déployer automatiquement un nouveau modèle.</p></div></div>
    <div className="kpi-grid">
      <div className="kpi-card"><div className="kpi-top"><Database size={17}/><span>Queue</span></div><div className="kpi-value">{pending.length}</div><div className="kpi-label">Exemples à revoir</div></div>
      <div className="kpi-card"><div className="kpi-top"><FlaskConical size={17}/><span>Registry</span></div><div className="kpi-value">{models.length}</div><div className="kpi-label">Versions de modèles</div></div>
      <div className="kpi-card"><div className="kpi-top"><CheckCircle2 size={17}/><span>Évaluation</span></div><div className="kpi-value">{evaluations.filter(e=>e.passed).length}</div><div className="kpi-label">Évaluations validées</div></div>
    </div>

    <div className="panel section-card">
      <div className="panel-head"><div><h2>File de revue</h2><span>Cas envoyés par le policy engine</span></div></div>
      {pending.map(e=><div className="incident-card" key={e.id}><div className="incident-icon" style={{background:"#10283a",color:"#9fd6ff"}}><Database size={16}/></div><div className="incident-body"><strong>{e.task}</strong><span>Exemple {e.example_id} · événement {e.source_event_id||"—"} · confiance {e.feedback?.confidence!=null?Math.round(e.feedback.confidence*100)+"%":"—"}</span></div><button className="icon-btn" title="Valider" onClick={()=>void review(e.id,"approved")}><CheckCircle2 size={17}/></button><button className="icon-btn" title="Rejeter" onClick={()=>void review(e.id,"rejected")}><XCircle size={17}/></button></div>)}
      {!pending.length&&<div className="empty-state"><CheckCircle2 size={28}/><strong>File vide</strong><p>Les cas nécessitant une revue apparaîtront ici.</p></div>}
    </div>

    <div className="dashboard-grid section-card">
      <div className="panel"><div className="panel-head"><div><h2>Versions de modèles</h2><span>Registre</span></div><RotateCcw size={17}/></div>{models.map(m=><div key={m.id} style={{display:"flex",gap:10,alignItems:"center",padding:"11px 0",borderBottom:"1px solid var(--line)"}}><div style={{flex:1}}><strong>{m.model_id} · {m.version}</strong><div className="muted" style={{fontSize:10}}>{m.task} · {m.status}</div></div><span className="badge badge-neutral">{m.dataset_version||"—"}</span></div>)}{!models.length&&<div className="empty-state">Aucune version enregistrée.</div>}</div>
      <div className="panel"><div className="panel-head"><div><h2>Évaluations</h2><span>Qualité avant promotion</span></div><FlaskConical size={17}/></div>{evaluations.map(e=><div key={e.id} style={{display:"flex",gap:10,alignItems:"center",padding:"11px 0",borderBottom:"1px solid var(--line)"}}><div style={{flex:1}}><strong>{e.model_id} · {e.version}</strong><div className="muted" style={{fontSize:10}}>{e.evaluation_set}</div></div><span className={e.passed?"badge badge-success":"badge badge-danger"}>{e.passed?"passed":"failed"}</span></div>)}{!evaluations.length&&<div className="empty-state">Aucune évaluation.</div>}</div>
    </div>
  </div>
}
