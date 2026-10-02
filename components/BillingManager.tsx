"use client";
import { useState } from "react";
import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";

export function BillingManager({tenant}:{tenant:any}){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function openPortal(){setBusy(true);setMessage("");try{const r=await fetch("/api/stripe/portal",{method:"POST"});const b=await r.json();if(!r.ok)throw new Error(b.error||"Portail indisponible");if(b.url)window.location.href=b.url;}catch(e){setMessage(e instanceof Error?e.message:"Erreur de facturation")}finally{setBusy(false)}}
  return <div><div className="page-title"><div><div className="eyebrow">SaaS & billing</div><h1>Abonnement</h1><p>Suivez le plan de l’espace et gérez la facturation depuis Be.Vision.</p></div>{tenant.stripe_customer_id&&<button className="btn btn-primary" onClick={()=>void openPortal()} disabled={busy}><ExternalLink size={15}/>{busy?"Ouverture…":"Gérer la facturation"}</button>}</div>
  <div className="dashboard-grid"><div className="panel"><div className="panel-head"><div><h2>Plan actuel</h2><span>Workspace</span></div><CreditCard size={18}/></div><div style={{fontSize:34,fontWeight:850,textTransform:"capitalize"}}>{tenant.plan}</div><div className="muted" style={{marginTop:8}}>Statut : <strong style={{color:"var(--accent)"}}>{tenant.billing_status}</strong></div>{tenant.billing_status==="trialing"&&<div className="health-pill" style={{display:"inline-flex",marginTop:14}}>Essai jusqu’au {tenant.trial_ends_at?new Date(tenant.trial_ends_at).toLocaleDateString("fr-FR"):"—"}</div>}</div>
  <div className="panel"><div className="panel-head"><div><h2>Couverture de l’espace</h2><span>Fonctions activables par le plan</span></div><ShieldCheck size={18}/></div><div className="flow"><div className="flow-step"><div className="flow-no">01</div><div><strong>Vidéo & edge</strong><span>Caméras IP, agent de site et événements structurés.</span></div></div><div className="flow-step"><div className="flow-no">02</div><div><strong>Workforce</strong><span>Personnel, enrôlement, présence et historique.</span></div></div><div className="flow-step"><div className="flow-no">03</div><div><strong>Opérations</strong><span>Règles, incidents, visiteurs, audit et analytique.</span></div></div></div></div></div>
  {message&&<div className="auth-status" style={{marginTop:14}}>{message}</div>}</div>
}
