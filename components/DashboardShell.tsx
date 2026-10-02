"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, BarChart3, Camera, ChevronRight, ClipboardClock, Cpu, CreditCard, Database, History, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, UserRoundPlus, X } from "lucide-react";
import { useState } from "react";

const items=[
 {href:"/dashboard",label:"Vue d’ensemble",icon:LayoutDashboard},
 {href:"/dashboard/cameras",label:"Caméras",icon:Camera},
 {href:"/dashboard/people",label:"Personnel",icon:Users},
 {href:"/dashboard/attendance",label:"Présences",icon:ClipboardClock},
 {href:"/dashboard/visitors",label:"Visiteurs",icon:UserRoundPlus},
 {href:"/dashboard/alerts",label:"Règles & alertes",icon:AlertTriangle},
 {href:"/dashboard/incidents",label:"Incidents",icon:ShieldCheck},
 {href:"/dashboard/edge",label:"Agents de site",icon:Cpu},
 {href:"/dashboard/analytics",label:"Analytique",icon:BarChart3},
 {href:"/dashboard/ai",label:"IA & qualité",icon:Database},
 {href:"/dashboard/audit",label:"Audit",icon:History},
 {href:"/dashboard/billing",label:"Abonnement",icon:CreditCard}
];

export function DashboardShell({children,tenantName,plan,userEmail,hasWorkspace}:{children:React.ReactNode;tenantName:string;plan:string;userEmail:string;hasWorkspace:boolean}){
 const pathname=usePathname();const [open,setOpen]=useState(false);
 return <div className="app-shell"><aside className={open?"sidebar sidebar-open":"sidebar"}><div className="sidebar-brand"><Link href="/" className="brand-lockup" onClick={()=>setOpen(false)}><span className="brand-mark">B</span><span>Be<span className="brand-dot">.</span>Vision</span></Link><button className="icon-btn mobile-close" onClick={()=>setOpen(false)} aria-label="Fermer"><X size={18}/></button></div><div className="workspace-card"><div className="workspace-kicker">ESPACE ENTREPRISE</div><div className="workspace-name">{tenantName}</div><div className="workspace-meta"><span className="status-dot"/> {plan} · production</div></div><nav className="side-nav">{items.map(item=>{const Icon=item.icon;const active=pathname===item.href||(item.href!=="/dashboard"&&pathname.startsWith(item.href));return <Link key={item.href} href={item.href} className={active?"side-link active":"side-link"} onClick={()=>setOpen(false)}><Icon size={17}/><span>{item.label}</span>{active&&<ChevronRight size={15} className="side-arrow"/>}</Link>})}</nav><div className="sidebar-bottom"><Link href="/dashboard/test-lab" className="test-link" onClick={()=>setOpen(false)}><Activity size={16}/><span>Labo de test maison</span></Link><div className="user-block"><div className="avatar">{userEmail.slice(0,1).toUpperCase()}</div><div className="user-copy"><strong>Compte connecté</strong><span title={userEmail}>{userEmail}</span></div><form action="/auth/signout" method="post"><button className="icon-btn"><LogOut size={16}/></button></form></div></div></aside>{open&&<button className="sidebar-overlay" onClick={()=>setOpen(false)} aria-label="Fermer"/>}<div className="shell-main"><header className="topbar"><button className="icon-btn menu-btn" onClick={()=>setOpen(true)}><Menu size={20}/></button><div className="topbar-title"><span className="live-indicator"><span className="status-dot"/> Service Be.Vision</span></div><div className="topbar-actions"><ShieldCheck size={16}/><span>Centre de contrôle</span></div></header>{!hasWorkspace&&<div className="workspace-warning">Votre compte est authentifié mais votre espace entreprise n’est pas encore rattaché.</div>}<main className="shell-content">{children}</main></div></div>;
}
