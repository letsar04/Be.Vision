"use client";

import { useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Plus, Trash2 } from "lucide-react";

const templates=[
  {key:"unknown",name:"Personne inconnue à l’entrée",definition:{event_type:"unknown_person",severity:"high",create_incident:true,action_type:"notify",title:"Personne inconnue détectée",message:"Une personne non reconnue a été détectée."}},
  {key:"after",name:"Accès hors horaires",definition:{event_type:"after_hours",severity:"high",create_incident:true,action_type:"notify",title:"Détection hors horaires",message:"Une présence a été détectée hors horaires."}},
  {key:"restricted",name:"Zone restreinte",definition:{event_type:"restricted_zone",severity:"critical",create_incident:true,action_type:"notify",title:"Présence en zone restreinte",message:"Une présence a été détectée dans une zone restreinte."}},
  {key:"confidence",name:"Reconnaissance à faible confiance",definition:{event_type:"face_recognized",max_confidence:0.75,severity:"medium",create_incident:false,action_type:"review",title:"Identification à vérifier",message:"La confiance de reconnaissance est faible."}}
];

export function PolicyManager({initialPolicies}:{initialPolicies:any[]}){
  const [policies,setPolicies]=useState(initialPolicies);
  const [message,setMessage]=useState("");
  const [show,setShow]=useState(false);
  const [name,setName]=useState("");

  async function add(definition:any,label:string){
    const finalName=name.trim()||label;
    const r=await fetch("/api/policies",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:finalName,definition})});
    const b=await r.json();
    if(!r.ok){setMessage(b.error||"Création impossible");return;}
    setPolicies([...policies,b.data]);setName("");setShow(false);setMessage("Règle créée.");
  }

  async function toggle(p:any){
    const r=await fetch("/api/policies/"+p.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:!p.enabled})});
    if(r.ok)setPolicies(policies.map(x=>x.id===p.id?{...x,enabled:!x.enabled}:x));
  }

  async function remove(p:any){
    if(!confirm("Supprimer cette règle ?"))return;
    const r=await fetch("/api/policies/"+p.id,{method:"DELETE"});
    if(r.ok)setPolicies(policies.filter(x=>x.id!==p.id));
  }

  return <div>
    <div className="page-title"><div><div className="eyebrow">Policy engine</div><h1>Règles & alertes</h1><p>Transformez un événement de vision en décision opérationnelle : notification, revue ou incident.</p></div><button className="btn btn-primary" onClick={()=>setShow(!show)}><Plus size={15}/> Nouvelle règle</button></div>
    {show&&<div className="panel section-card"><div className="form-field"><label>Nom personnalisé (optionnel)</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Surveillance entrepôt"/></div><div style={{display:"grid",gap:8,marginTop:14}}>{templates.map(t=><button key={t.key} className="btn btn-secondary" style={{justifyContent:"flex-start"}} onClick={()=>void add(t.definition,t.name)}><BellRing size={15}/>{t.name}</button>)}</div></div>}
    {message&&<div className="auth-status" style={{marginTop:12}}>{message}</div>}
    <div className="section-card" style={{display:"grid",gap:10}}>
      {policies.map(p=><div className="incident-card" key={p.id}><div className="incident-icon" style={{background:p.enabled?"#102b22":"#172229",color:p.enabled?"var(--accent)":"var(--muted)"}}><AlertTriangle size={17}/></div><div className="incident-body"><strong>{p.name}</strong><span>{p.definition?.event_type||"événements"} · sévérité {p.definition?.severity||"medium"}</span></div><button className="btn btn-secondary btn-small" onClick={()=>void toggle(p)}>{p.enabled?<CheckCircle2 size={13}/>:<span>Activer</span>} {p.enabled?"Active":""}</button><button className="icon-btn" onClick={()=>void remove(p)}><Trash2 size={15}/></button></div>)}
      {!policies.length&&<div className="panel empty-state"><AlertTriangle size={26}/><strong>Aucune règle</strong><p>Commencez avec une règle prête à l'emploi.</p><button className="btn btn-secondary btn-small" onClick={()=>setShow(true)}>Créer une règle</button></div>}
    </div>
  </div>
}
