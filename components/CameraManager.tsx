"use client";

import { useState } from "react";
import { Camera, MapPin, Plus, Radio, Trash2 } from "lucide-react";

export function CameraManager({initialCameras,sites}:{initialCameras:any[];sites:any[]}) {
  const [cameras,setCameras]=useState(initialCameras);
  const [show,setShow]=useState(false);
  const [siteName,setSiteName]=useState("");
  const [creatingSite,setCreatingSite]=useState(false);
  const [form,setForm]=useState({name:"",source_type:"rtsp",source_uri:"",zone:"",site_id:sites[0]?.id||"",role:"entry"});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function addSite(){
    if(!siteName.trim()) return;
    setCreatingSite(true);
    try{
      const r=await fetch("/api/sites",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:siteName})});
      const b=await r.json();
      if(!r.ok)throw new Error(b.error||"Création du site impossible");
      setSiteName("");location.reload();
    }catch(e){setMessage(e instanceof Error?e.message:"Erreur");}finally{setCreatingSite(false);}
  }

  async function createCamera(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/cameras",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const b=await r.json();
      if(!r.ok)throw new Error(b.error||"Création impossible");
      setCameras([b.data,...cameras]);setShow(false);
      setForm({name:"",source_type:"rtsp",source_uri:"",zone:"",site_id:sites[0]?.id||"",role:"entry"});
    }catch(e){setMessage(e instanceof Error?e.message:"Erreur");}finally{setBusy(false);}
  }

  async function removeCamera(id:string){
    if(!confirm("Supprimer cette caméra ?"))return;
    const r=await fetch("/api/cameras/"+id,{method:"DELETE"});
    if(r.ok)setCameras(cameras.filter(c=>c.id!==id));
  }

  return <div>
    <div className="page-title"><div><div className="eyebrow">Infrastructure vidéo</div><h1>Caméras</h1><p>En production, utilisez des caméras IP. Le smartphone reste réservé au Labo de test maison.</p></div><button className="btn btn-primary" onClick={()=>setShow(!show)}><Plus size={16}/> Ajouter une caméra</button></div>

    {show&&<form className="panel section-card" onSubmit={createCamera}><div className="panel-head"><div><h2>Nouvelle source</h2><span>RTSP pour caméra IP · webcam/téléphone pour test</span></div></div><div className="form-grid">
      <Field label="Nom"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Entrée principale"/></Field>
      <Field label="Type"><select value={form.source_type} onChange={e=>setForm({...form,source_type:e.target.value})}><option value="rtsp">RTSP — caméra IP</option><option value="webcam">Webcam — test PC</option><option value="phone">Téléphone — test maison</option></select></Field>
      <Field label="Rôle de la caméra"><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="entry">Entrée — pointage arrivée</option><option value="exit">Sortie — pointage départ</option><option value="presence">Présence — suivi d’activité</option><option value="restricted">Zone sensible — alerte</option></select></Field>
      <Field label="URI / source"><input value={form.source_uri} onChange={e=>setForm({...form,source_uri:e.target.value})} placeholder="rtsp://user:password@192.168.1.20:554/stream"/></Field>
      <Field label="Zone"><input value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})} placeholder="Entrée / Parking / Atelier"/></Field>
      <Field label="Site"><select value={form.site_id} onChange={e=>setForm({...form,site_id:e.target.value})}><option value="">Aucun site</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <div className="form-actions" style={{gridColumn:"1/-1"}}><button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Annuler</button><button className="btn btn-primary" disabled={busy}>{busy?"Ajout…":"Ajouter"}</button></div>
    </div>{message&&<div className="auth-status">{message}</div>}</form>}

    <div className="panel section-card"><div className="panel-head"><div><h2>Sites</h2><span>{sites.length} site(s) configuré(s)</span></div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{sites.map(s=><span className="badge badge-neutral" key={s.id}><MapPin size={12}/>{s.name}</span>)}{!sites.length&&<span className="muted">Aucun site</span>}</div><div style={{display:"flex",gap:8,marginTop:14}}><input value={siteName} onChange={e=>setSiteName(e.target.value)} placeholder="Nouveau site" style={{flex:1,border:"1px solid var(--line)",background:"#09151c",color:"var(--text)",borderRadius:10,padding:"10px 12px"}}/><button className="btn btn-secondary btn-small" onClick={()=>void addSite()} disabled={creatingSite}>{creatingSite?"…":"Créer le site"}</button></div></div>

    <div className="camera-grid section-card">{cameras.map(c=><div className="camera-card" key={c.id}><div className="camera-preview"><Camera size={30}/></div><div className="camera-body"><div className="camera-title">{c.name}</div><div className="camera-sub">{c.source_type==="rtsp"?"Caméra IP / RTSP":c.source_type==="phone"?"Téléphone (test)":"Webcam (test)"}</div><div className="camera-meta"><span className={c.enabled?"badge badge-success":"badge badge-neutral"}>{c.enabled?"Active":"Désactivée"}</span><span className="muted" style={{fontSize:10}}>{c.metadata?.role||"rôle non défini"} · {c.zone||"zone non définie"}</span></div><div className="camera-actions" style={{marginTop:12}}><span className="badge badge-info"><Radio size={11}/> source configurée</span><button className="icon-btn" title="Supprimer" onClick={()=>void removeCamera(c.id)}><Trash2 size={15}/></button></div></div></div>)}{!cameras.length&&<div className="panel empty-state" style={{gridColumn:"1/-1"}}><Camera size={26}/><strong>Aucune caméra</strong><p>Ajoutez une caméra IP RTSP pour commencer. Le Labo de test sert aux essais à domicile.</p></div>}</div>
  </div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="form-field"><label>{label}</label>{children}</div>}
