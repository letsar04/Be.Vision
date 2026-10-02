"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, AlertTriangle, BarChart3, Camera, ChevronRight, ClipboardCheck, Cpu,
  CreditCard, Database, History, LayoutDashboard, LogOut, Menu, Settings,
  ShieldCheck, Users, UserRoundPlus, X
} from "lucide-react";
import { useState } from "react";

const items = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  { href: "/dashboard/cameras", label: "Caméras", icon: Camera },
  { href: "/dashboard/people", label: "Personnel", icon: Users },
  { href: "/dashboard/attendance", label: "Présences", icon: ClipboardCheck },
  { href: "/dashboard/visitors", label: "Visiteurs", icon: UserRoundPlus },
  { href: "/dashboard/alerts", label: "Règles & alertes", icon: AlertTriangle },
  { href: "/dashboard/incidents", label: "Incidents", icon: ShieldCheck },
  { href: "/dashboard/edge", label: "Agents de site", icon: Cpu },
  { href: "/dashboard/analytics", label: "Analytique", icon: BarChart3 },
  { href: "/dashboard/data", label: "Open Data Burkina", icon: Database },
  { href: "/dashboard/ai", label: "IA & qualité", icon: Database },
  { href: "/dashboard/audit", label: "Audit", icon: History },
  { href: "/dashboard/billing", label: "Abonnement", icon: CreditCard }
];

export function DashboardShell({
  children,
  tenantName,
  plan,
  userEmail,
  hasWorkspace,
  setupCompleted
}: {
  children: React.ReactNode;
  tenantName: string;
  plan: string;
  userEmail: string;
  hasWorkspace: boolean;
  setupCompleted: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
        <div className="sidebar-brand">
          <Link href="/dashboard" className="brand-lockup" onClick={() => setOpen(false)}>
            <span className="brand-mark">B</span>
            <span>Be<span className="brand-dot">.</span>Vision</span>
          </Link>
          <button className="icon-btn mobile-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18}/></button>
        </div>

        <Link href="/dashboard/settings" className="workspace-card workspace-card-link" onClick={() => setOpen(false)}>
          <div className="workspace-kicker">ESPACE ENTREPRISE</div>
          <div className="workspace-name">{tenantName}</div>
          <div className="workspace-meta"><span className="status-dot"/> {setupCompleted ? plan + " · production" : "Configuration à terminer"}</div>
        </Link>

        <nav className="side-nav">
          {items.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return <Link key={item.href} href={item.href} className={active ? "side-link active" : "side-link"} onClick={() => setOpen(false)}>
              <Icon size={17}/><span>{item.label}</span>{active && <ChevronRight size={15} className="side-arrow"/>}
            </Link>;
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link href="/dashboard/settings" className="settings-link" onClick={() => setOpen(false)}>
            <Settings size={16}/><span>Paramètres de l’espace</span>
          </Link>
          <Link href="/dashboard/test-lab" className="test-link" onClick={() => setOpen(false)}>
            <Activity size={16}/><span>Labo de test maison</span>
          </Link>
          <div className="user-block">
            <div className="avatar">{userEmail.slice(0, 1).toUpperCase()}</div>
            <div className="user-copy"><strong>Compte connecté</strong><span title={userEmail}>{userEmail}</span></div>
            <form action="/auth/signout" method="post"><button className="icon-btn" aria-label="Se déconnecter"><LogOut size={16}/></button></form>
          </div>
        </div>
      </aside>

      {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Fermer"/>}

      <div className="shell-main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu size={20}/></button>
          <div className="topbar-title"><span className="live-indicator"><span className="status-dot"/> Service Be.Vision</span></div>
          <div className="topbar-actions">
            <Link className="topbar-action-link" href="/dashboard/settings"><Settings size={16}/><span>Paramètres</span></Link>
            <span className="topbar-divider"/>
            <ShieldCheck size={16}/><span>Centre de contrôle</span>
          </div>
        </header>

        {!hasWorkspace && (
          <div className="workspace-warning">
            <span>Votre espace est en cours de préparation.</span>
            <Link href="/dashboard/settings">Ouvrir les paramètres</Link>
          </div>
        )}

        <main className="shell-content">{children}</main>
      </div>
    </div>
  );
}
