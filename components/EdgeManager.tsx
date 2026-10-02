"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Cpu, Plus, Server, Terminal } from "lucide-react";

export function EdgeManager({initialAgents}:{initialAgents:any[]}){
  const [agents,setAgents]=useState(initialAgents);
  const [name,setName]=useState("");
  const [token,setToken]=useState("");
  const [message,setMessage]=useState("");

  async function create(){
    const r=await fetch("/api/edge/agents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name||"Agent de site"})});
    const b=await r.json();
    if(!r.ok){setMessage(b.error||"Impossible de créer l’agent");return;}
    setAgents([b.data,...agents]);setToken(b.token);setName("");
  }

  async function copy(value:string){
    try{await navigator.clipboard.writeText(value);setMessage("Copié.");}catch{setMessage("Copie non disponible.");}
  }

  return <div>
    <div className="page-title"><div><div className="eyebrow">Edge computing</div><h1>Agents de site</h1><p>Un agent tourne sur un mini-PC, serveur ou machine du réseau client. Il relie les caméras IP au cloud sans exposer directement les flux internes.</p></div><button className="btn btn-primary" onClick={()=>void create()}><Plus size={15}/> Ajouter un agent</button></div>

    {token&&<div className="panel section-card"><div className="panel-head"><div><h2>Token généré — à enregistrer maintenant</h2><span>Le secret brut n’est pas stocké dans l’application.</span></div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><input readOnly value={token} style={{flex:1,border:"1px solid var(--line)",background:"#09151c",color:"var(--text)",borderRadius:10,padding:"11px 12px"}}/><button className="btn btn-secondary btn-small" onClick={()=>void copy(token)}><Copy size={13}/> Copier</button></div><p className="muted" style={{fontSize:11,marginTop:10}}>Après rechargement de la page, le token brut ne sera plus affiché.</p></div>}

    <div className="camera-grid section-card">{agents.map(a=><div className="camera-card" key={a.id}><div className="camera-preview"><Server size={30}/></div><div className="camera-body"><div className="camera-title">{a.name}</div><div className="camera-sub">Version {a.version||"à installer"}</div><div className="camera-meta"><span className={a.status==="online"?"badge badge-success":"badge badge-warning"}>{a.status}</span><span className="muted" style={{fontSize:10}}>{a.last_seen_at?new Date(a.last_seen_at).toLocaleString("fr-FR"):"jamais connecté"}</span></div></div></div>)}{!agents.length&&<div className="panel empty-state" style={{gridColumn:"1/-1"}}><Cpu size={28}/><strong>Aucun agent de site</strong><p>Créez un agent puis installez-le sur un ordinateur du réseau de l’entreprise.</p></div>}</div>

    <div className="panel section-card"><div className="panel-head"><div><h2>Installation</h2><span>Modèle d’exécution recommandé</span></div></div><div className="flow"><div className="flow-step"><div className="flow-no">01</div><div><strong>Créer l’agent</strong><span>Générez un token depuis cette page et conservez-le dans l’environnement de la machine sur site.</span></div></div><div className="flow-step"><div className="flow-no">02</div><div><strong>Configurer une caméra</strong><span>Déclarez sa source RTSP et son identifiant Be.Vision dans l’agent.</span></div></div><div className="flow-step"><div className="flow-no">03</div><div><strong>Lancer le conteneur</strong><span>Le processus envoie des heartbeats et des événements structurés au cloud.</span></div></div></div><div className="arch-box" style={{marginTop:16}}><div className="arch-title"><Terminal size={12}/> Variables d’exemple</div><pre style={{whiteSpace:"pre-wrap",color:"#a8ded0",fontSize:11,lineHeight:1.6,marginBottom:0}}>BEVISION_INGEST_URL=https://votre-app.vercel.app
BEVISION_AGENT_TOKEN=&lt;token&gt;
CAMERA_ID=&lt;uuid caméra&gt;
SOURCE_URI=rtsp://user:password@camera/stream
FACECOMPARE_URL=http://facecompare-api:8000</pre></div></div>
    {message&&<p className="muted" style={{marginTop:10}}>{message}</p>}
  </div>
}
