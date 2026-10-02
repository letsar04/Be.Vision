"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Plus, UserPlus, XCircle } from "lucide-react";

export function VisitorManager({initialVisitors,sites}:{initialVisitors:any[];sites:any[]}){
  const [visitors,setVisitors]=useState(initialVisitors);
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [form,setForm]=useState({full_name:"",company:"",phone:"",email:"",host_name:"",purpose:"",access_zone:"",site_id:sites[0]?.id||"",scheduled_at:""});

  async function create(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/visitors",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const b=await r.json();if(!r.ok)throw new Error(b.error||"Création impossible");
      setVisitors([{...b.visitor,visit:b.visit},...visitors]);setShow(false);setForm({...form,full_name:"",company:"",phone:"",email:"",host_name:"",purpose:"",access_zone:"",scheduled_at:""});
      setMessage("Visiteur programmé. Code de passage : "+b.visit.pass_code);
    }catch(error){setMessage(error instanceof Error?error.message:"Erreur");}finally{setBusy(false);}
  }

  async function update(id:string,status:string){
    const r=await fetch("/api/visitors/visits/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    if(r.ok)setVisitors(visitors.map(v=>v.visit?.id===id?{...v,visit:{...v.visit,status}}:v));
  }

  return <div>
    <div className="page-title"><div><div className="eyebrow">Site operations</div><h1>Visiteurs</h1><p>Préparez les visites, le site et la zone d’accès. Le passage peut ensuite être marqué comme arrivé, sorti ou refusé.</p></div><button className="btn btn-primary" onClick={()=>setShow(!show)}><Plus size={15}/> Programmer une visite</button></div>
    {show&&<form className="panel section-card" onSubmit={create}><div className="form-grid">
      <Field label="Nom complet"><input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></Field>
      <Field label="Entreprise"><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></Field>
      <Field label="Téléphone"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field>
      <Field label="Email"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
      <Field label="Hôte"><input value={form.host_name} onChange={e=>setForm({...form,host_name:e.target.value})} placeholder="Responsable de la visite"/></Field>
      <Field label="Motif"><input value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="Réunion / Livraison / Audit"/></Field>
      <Field label="Zone d’accès"><input value={form.access_zone} onChange={e=>setForm({...form,access_zone:e.target.value})} placeholder="Accueil / Atelier / Bureau"/></Field>
      <Field label="Site"><select value={form.site_id} onChange={e=>setForm({...form,site_id:e.target.value})}><option value="">Aucun</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <div className="form-actions" style={{gridColumn:"1/-1"}}><button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Annuler</button><button className="btn btn-primary" disabled={busy}>{busy?"Enregistrement…":"Programmer"}</button></div>
    </div></form>}
    {message&&<div className="auth-status" style={{marginTop:12}}>{message}</div>}
    <div className="section-card" style={{display:"grid",gap:10}}>{visitors.map(v=><div className="incident-card" key={v.id}><div className="incident-icon" style={{background:"#10272b",color:"var(--accent)"}}><UserPlus size={17}/></div><div className="incident-body"><strong>{v.full_name}</strong><span>{v.company||"Entreprise non renseignée"} · {v.visit?.host_name||"Hôte non renseigné"} · {v.visit?.access_zone||"Zone libre"}</span></div><span className={v.visit?.status==="checked_in"?"badge badge-success":v.visit?.status==="denied"?"badge badge-danger":"badge badge-neutral"}>{v.visit?.status||"scheduled"}</span><div style={{display:"flex",gap:5}}>{v.visit?.status==="scheduled"&&<button className="icon-btn" title="Faire entrer" onClick={()=>void update(v.visit.id,"checked_in")}><CheckCircle2 size={15}/></button>}{v.visit?.status==="checked_in"&&<button className="icon-btn" title="Faire sortir" onClick={()=>void update(v.visit.id,"checked_out")}><Clock3 size={15}/></button>}{v.visit?.status==="scheduled"&&<button className="icon-btn" title="Refuser" onClick={()=>void update(v.visit.id,"denied")}><XCircle size={15}/></button>}</div></div>)}</div>
    {!visitors.length&&<div className="panel empty-state section-card"><UserPlus size={28}/><strong>Aucun visiteur</strong><p>Créez votre premier passage planifié pour tester le module visiteurs.</p></div>}
  </div>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="form-field"><label>{label}</label>{children}</div>}
