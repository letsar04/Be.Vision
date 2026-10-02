"use client";

import { useState } from "react";
import { ArrowRight, Building2, Camera, CheckCircle2, Cpu, LockKeyhole, Save, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

type Props = { initialTenant: any | null; initialSite: any | null };

export function WorkspaceSettings({ initialTenant, initialSite }: Props) {
  const [form, setForm] = useState({
    name: initialTenant?.name || "",
    legal_name: initialTenant?.legal_name || "",
    industry: initialTenant?.industry || "",
    company_size: initialTenant?.company_size || "",
    country: initialTenant?.country || "",
    city: initialTenant?.city || "",
    address: initialTenant?.address || "",
    phone: initialTenant?.phone || "",
    website: initialTenant?.website || "",
    site_name: initialSite?.name || "",
    site_address: initialSite?.address || "",
    timezone: initialSite?.timezone || "Africa/Ouagadougou"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Enregistrement impossible.");
      setMessage("Paramètres enregistrés. Votre espace est maintenant configuré.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-layout">
      <form className="panel settings-form" onSubmit={save}>
        <div className="panel-head">
          <div><h2>Informations générales</h2><span>Les éléments essentiels de votre espace</span></div>
          <Building2 size={18}/>
        </div>

        <div className="form-grid">
          <Field label="Nom d’affichage de l’entreprise" required><input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex. Besoft Entertainment"/></Field>
          <Field label="Raison sociale"><input value={form.legal_name} onChange={e => set("legal_name", e.target.value)} placeholder="Nom légal"/></Field>
          <Field label="Pays" required><input required value={form.country} onChange={e => set("country", e.target.value)} placeholder="Burkina Faso"/></Field>
          <Field label="Ville"><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Ouagadougou"/></Field>
          <Field label="Secteur d’activité"><input value={form.industry} onChange={e => set("industry", e.target.value)} placeholder="Sécurité, industrie, retail…"/></Field>
          <Field label="Taille de l’entreprise"><select value={form.company_size} onChange={e => set("company_size", e.target.value)}><option value="">À préciser</option><option>1–10</option><option>11–50</option><option>51–200</option><option>201–500</option><option>500+</option></select></Field>
          <Field label="Téléphone"><input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+226 …"/></Field>
          <Field label="Site web"><input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://…"/></Field>
          <Field label="Adresse" full><textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Adresse de l’entreprise"/></Field>
        </div>

        <div className="settings-divider"/>
        <div className="panel-head">
          <div><h2>Site principal</h2><span>Le premier site opérationnel associé à votre espace</span></div>
          <ShieldCheck size={18}/>
        </div>

        <div className="form-grid">
          <Field label="Nom du site" required><input required value={form.site_name} onChange={e => set("site_name", e.target.value)} placeholder="Siège, usine, dépôt…"/></Field>
          <Field label="Fuseau horaire" required><select required value={form.timezone} onChange={e => set("timezone", e.target.value)}><option value="Africa/Ouagadougou">Africa/Ouagadougou</option><option value="Africa/Abidjan">Africa/Abidjan</option><option value="UTC">UTC</option><option value="Europe/Paris">Europe/Paris</option></select></Field>
          <Field label="Adresse du site" full><textarea value={form.site_address} onChange={e => set("site_address", e.target.value)} placeholder="Adresse ou repère du site principal"/></Field>
        </div>

        {message && <div className="auth-status info"><CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>{message}</div>}

        <div className="form-actions">
          <Link className="btn btn-secondary" href="/dashboard">Annuler</Link>
          <button className="btn btn-primary" disabled={saving}><Save size={15}/>{saving ? "Enregistrement…" : "Enregistrer les paramètres"}</button>
        </div>
      </form>

      <aside className="settings-side">
        <div className="panel">
          <div className="eyebrow">Configuration progressive</div>
          <h2>Gardez le contrôle sans surcharger le dashboard.</h2>
          <p className="muted">Les fonctions complexes restent accessibles depuis leurs espaces dédiés. Le centre de contrôle reste consacré aux opérations.</p>
          <div className="settings-links">
            <Quick href="/dashboard/cameras" icon={<Camera size={16}/>} title="Caméras" text="RTSP, zones et supervision"/>
            <Quick href="/dashboard/people" icon={<Users size={16}/>} title="Personnel" text="Annuaire et enrôlement"/>
            <Quick href="/dashboard/edge" icon={<Cpu size={16}/>} title="Agents de site" text="Connectivité locale"/>
            <Quick href="/dashboard/alerts" icon={<ShieldCheck size={16}/>} title="Sécurité" text="Règles et incidents"/>
            <Quick href="/dashboard/ai" icon={<LockKeyhole size={16}/>} title="IA & qualité" text="Modèles et revue"/>
          </div>
        </div>
        <div className="panel">
          <div className="eyebrow">Compte</div>
          <strong>Prochaine étape</strong>
          <p className="muted">Après la configuration générale, vous pouvez directement importer le personnel et déclarer les caméras.</p>
          <Link className="btn btn-secondary btn-small" href="/dashboard/people">Importer le personnel <ArrowRight size={14}/></Link>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, required, children, full }: { label: string; required?: boolean; children: React.ReactNode; full?: boolean }) {
  return <div className={"form-field" + (full ? " full" : "")}><label>{label}{required ? " *" : ""}</label>{children}</div>;
}

function Quick({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link href={href} className="settings-quick"><span className="settings-quick-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><ArrowRight size={14}/></Link>;
}
