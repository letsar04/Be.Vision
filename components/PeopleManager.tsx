"use client";

import { useState } from "react";
import { CheckCircle2, Plus, ShieldCheck, Upload, UserRound, XCircle } from "lucide-react";

export function PeopleManager({initialPeople}:{initialPeople:any[]}){
  const [people,setPeople]=useState(initialPeople);
  const [form,setForm]=useState({display_name:"",external_id:"",department:"",role:"",consent_recorded:false});
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function createPerson(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/identities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const b=await r.json();if(!r.ok)throw new Error(b.error||"Création impossible");
      setPeople([...people,b.data].sort((a,b)=>a.display_name.localeCompare(b.display_name)));
      setForm({display_name:"",external_id:"",department:"",role:"",consent_recorded:false});
      setShow(false);
    }catch(e){setMessage(e instanceof Error?e.message:"Erreur");}finally{setBusy(false);}
  }

  async function enroll(id:string,file:File){
    setMessage("");
    const fd=new FormData();fd.append("image",file);
    try{
      const r=await fetch("/api/identities/"+id+"/enroll",{method:"POST",body:fd});
      const b=await r.json();if(!r.ok)throw new Error(b.error||"Enrôlement impossible");
      setMessage("Empreinte enregistrée. La personne peut maintenant être reconnue par le moteur vision.");
    }catch(e){setMessage(e instanceof Error?e.message:"Le moteur de vision ne répond pas.");}
  }

  return (
    <div>
      <div className="page-title">
        <div><div className="eyebrow">Identités & habilitations</div><h1>Personnel</h1><p>Une identité métier est séparée de son empreinte biométrique. L’enrôlement est explicite et auditable.</p></div>
        <button className="btn btn-primary" onClick={()=>setShow(!show)}><Plus size={16}/> Ajouter une personne</button>
      </div>

      {show && <form className="panel section-card" onSubmit={createPerson}>
        <div className="form-grid">
          <Field label="Nom complet" full><input required value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} placeholder="Nom Prénom"/></Field>
          <Field label="Matricule"><input value={form.external_id} onChange={e=>setForm({...form,external_id:e.target.value})} placeholder="EMP-001"/></Field>
          <Field label="Département"><input value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="Production"/></Field>
          <Field label="Fonction"><input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="Responsable"/></Field>
          <label style={{display:"flex",gap:8,alignItems:"center",gridColumn:"1/-1",fontSize:12}}><input type="checkbox" checked={form.consent_recorded} onChange={e=>setForm({...form,consent_recorded:e.target.checked})}/><span>Consentement / base légale enregistré(e) par l’entreprise</span></label>
          <div className="form-actions" style={{gridColumn:"1/-1"}}><button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Annuler</button><button className="btn btn-primary" disabled={busy}>{busy?"Création…":"Créer"}</button></div>
        </div>
      </form>}

      {message && <div className="auth-status" style={{marginTop:12}}>{message}</div>}

      <div className="panel section-card">
        <table className="table">
          <thead><tr><th>Personne</th><th>Organisation</th><th>Biométrie</th><th>Statut</th></tr></thead>
          <tbody>
          {people.map(p=><tr key={p.id}>
            <td><div className="person-row"><div className="person-avatar"><UserRound size={17}/></div><div><strong>{p.display_name}</strong><div className="muted" style={{fontSize:10}}>{p.external_id||"Sans matricule"}</div></div></div></td>
            <td><div>{p.metadata?.department||"—"}</div><div className="muted" style={{fontSize:10}}>{p.metadata?.role||""}</div></td>
            <td>
              <label className="btn btn-secondary btn-small" style={{display:"inline-flex"}}><Upload size={13}/> Enrôler<input type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void enroll(p.id,f)}}/></label>
            </td>
            <td><span className="badge badge-success"><CheckCircle2 size={11}/>{p.status}</span></td>
          </tr>)}
          </tbody>
        </table>
        {!people.length && <div className="empty-state"><ShieldCheck size={26}/><strong>Votre annuaire est vide</strong><p>Créez une personne, puis lancez un enrôlement depuis une photo contrôlée.</p></div>}
      </div>
    </div>
  );
}
function Field({label,children,full}:{label:string;children:React.ReactNode;full?:boolean}){return <div className={"form-field"+(full?" full":"")}><label>{label}</label>{children}</div>}
