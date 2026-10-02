import Link from "next/link";
import {
  AlertTriangle, ArrowRight, Camera, CheckCircle2, CircleAlert, Clock3,
  Cpu, Play, Settings, ShieldCheck, Users, Zap
} from "lucide-react";
import { createServerClient } from "../../lib/supabase-server";
import { ensureWorkspace } from "../../lib/workspace-provision";
import { requireWorkspace, withTimeout } from "../../lib/workspace";
import { DemoEventButton } from "../../components/DemoEventButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await requireWorkspace();

  if (context.error) {
    return (
      <div className="page-wrap centered-state">
        <div className="state-icon danger">!</div>
        <h1>Connexion indisponible</h1>
        <p>{context.error}</p>
        <Link href="/login" className="btn btn-secondary">Retour à la connexion</Link>
      </div>
    );
  }

  const supabase = await createServerClient();
  let tenant = context.tenant;
  let membership = context.membership;

  if (!tenant || !membership) {
    try {
      const provisioned = await ensureWorkspace(supabase, context.user);
      tenant = provisioned.tenant;
      membership = { tenant_id: tenant.id, role: provisioned.role };
    } catch (error) {
      console.error("[dashboard] workspace provisioning failed", error);
    }
  }

  if (!tenant || !membership) {
    return (
      <div className="page-wrap">
        <div className="dashboard-setup-banner">
          <div>
            <div className="eyebrow">Espace de travail</div>
            <h2>Votre compte est prêt. Configurez maintenant votre espace entreprise.</h2>
            <p>Vous pouvez accéder au dashboard et revenir à cette configuration à tout moment.</p>
          </div>
          <Link className="btn btn-primary" href="/dashboard/settings"><Settings size={16}/> Configurer l’espace</Link>
        </div>

        <div className="kpi-grid">
          <Kpi icon={<Camera size={17}/>} label="Caméras" value={0} hint="À configurer" />
          <Kpi icon={<Users size={17}/>} label="Personnel" value={0} hint="À importer" />
          <Kpi icon={<CircleAlert size={17}/>} label="Incidents" value={0} hint="Aucun incident" />
          <Kpi icon={<ShieldCheck size={17}/>} label="Règles" value={0} hint="À configurer" />
        </div>

        <ModuleGrid />
      </div>
    );
  }

  const tenantId = tenant.id;
  const today = new Date().toISOString().slice(0, 10);

  const result = await withTimeout(
    Promise.all([
      supabase.from("cameras").select("id,name,source_type,zone,enabled,site_id,metadata,created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("identities").select("id,display_name,external_id,status,metadata,created_at").eq("tenant_id", tenantId).eq("status", "active").order("display_name"),
      supabase.from("attendance_sessions").select("id,identity_id,work_date,first_seen_at,last_seen_at,status,camera_id").eq("tenant_id", tenantId).eq("work_date", today).order("first_seen_at", { ascending: false }),
      supabase.from("incidents").select("id,title,severity,status,created_at,updated_at").eq("tenant_id", tenantId).neq("status", "resolved").order("created_at", { ascending: false }).limit(6),
      supabase.from("edge_agents").select("id,name,status,last_seen_at,version").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("vision_events").select("id,type,occurred_at,confidence,camera_id,subject_id,metadata").eq("tenant_id", tenantId).order("occurred_at", { ascending: false }).limit(12),
      supabase.from("sites").select("id,name,status").eq("tenant_id", tenantId).order("name"),
      supabase.from("policies").select("id,name,enabled,definition").eq("tenant_id", tenantId).order("name")
    ]),
    9000
  );

  const cameras = result[0].data || [];
  const people = result[1].data || [];
  const sessions = result[2].data || [];
  const incidents = result[3].data || [];
  const agents = result[4].data || [];
  const events = result[5].data || [];
  const sites = result[6].data || [];
  const policies = result[7].data || [];

  const onlineAgents = agents.filter((a: any) => a.status === "online" || Boolean(a.last_seen_at && Date.now() - new Date(a.last_seen_at).getTime() < 90000)).length;
  const activeCameras = cameras.filter((c: any) => c.enabled).length;

  function label(type: string) {
    const labels: Record<string, string> = {
      face_recognized: "Visage reconnu",
      unknown_person: "Personne inconnue",
      camera_offline: "Caméra hors ligne",
      restricted_zone: "Zone restreinte",
      after_hours: "Hors horaires",
      arrival: "Arrivée",
      presence: "Présence",
      departure: "Départ"
    };
    return labels[type] || type.replaceAll("_", " ");
  }

  return (
    <div className="page-wrap">
      {!tenant.setup_completed && (
        <div className="dashboard-setup-banner compact">
          <div className="setup-progress">
            <div className="setup-progress-ring">!</div>
            <div>
              <strong>Votre espace entreprise est créé.</strong>
              <span>Complétez les informations de base pour personnaliser votre environnement.</span>
            </div>
          </div>
          <Link className="btn btn-secondary btn-small" href="/dashboard/settings"><Settings size={14}/> Configurer</Link>
        </div>
      )}

      <div className="page-title">
        <div>
          <div className="eyebrow">Centre de contrôle</div>
          <h1>{tenant.name}</h1>
          <p>Opérations multi-sites · {sites.length} site(s) · {people.length} identité(s) active(s)</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <DemoEventButton disabled={!cameras.length || !people.length} />
          <Link className="btn btn-primary" href="/dashboard/cameras"><Camera size={16}/> Ajouter une caméra</Link>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi icon={<Camera size={17}/>} label="Caméras actives" value={activeCameras} hint={agents.length ? onlineAgents + "/" + agents.length + " agents edge en ligne" : "Aucun agent de site"} />
        <Kpi icon={<Users size={17}/>} label="Présents aujourd’hui" value={sessions.length} hint="Sessions de présence détectées" />
        <Kpi icon={<CircleAlert size={17}/>} label="Incidents ouverts" value={incidents.length} hint={incidents.length ? "À traiter par l’équipe" : "Aucun incident ouvert"} danger={incidents.length > 0} />
        <Kpi icon={<ShieldCheck size={17}/>} label="Règles actives" value={policies.filter((p: any) => p.enabled).length} hint={policies.length + " règle(s) configurée(s)"} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head"><div><h2>Flux opérationnel</h2><span>Derniers événements</span></div><Link className="btn btn-secondary btn-small" href="/dashboard/analytics">Analytique</Link></div>
          {events.length ? (
            <table className="table">
              <thead><tr><th>Événement</th><th>Confiance</th><th>Moment</th></tr></thead>
              <tbody>{events.map((event: any) => <tr key={event.id}><td><strong style={{ textTransform: "capitalize" }}>{label(event.type)}</strong><div className="muted" style={{ marginTop: 4 }}>{event.metadata?.zone || "Zone non renseignée"}</div></td><td>{event.confidence ? Math.round(event.confidence * 100) + "%" : "—"}</td><td className="muted">{new Date(event.occurred_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</td></tr>)}</tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Play size={24} style={{ marginBottom: 10 }}/>
              <strong>Aucun événement</strong>
              <p>Configurez une caméra et un agent de site, ou utilisez le labo de test pour valider le pipeline métier.</p>
              <Link className="btn btn-secondary btn-small" href="/dashboard/cameras">Commencer avec une caméra</Link>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><div><h2>État du système</h2><span>Supervision technique</span></div></div>
          <HealthRow icon={<Cpu size={15}/>} label="Agents de site" value={agents.length ? onlineAgents + "/" + agents.length + " en ligne" : "À installer"} ok={agents.length > 0 && onlineAgents === agents.length}/>
          <HealthRow icon={<Camera size={15}/>} label="Caméras" value={cameras.length ? activeCameras + "/" + cameras.length + " actives" : "À configurer"} ok={cameras.length > 0}/>
          <HealthRow icon={<Zap size={15}/>} label="Moteur vision" value={process.env.FACECOMPARE_API_URL ? "Connecté" : "À connecter"} ok={Boolean(process.env.FACECOMPARE_API_URL)}/>
          <HealthRow icon={<ShieldCheck size={15}/>} label="Facturation" value={tenant.billing_status === "trialing" ? "Essai actif" : tenant.billing_status} ok={tenant.billing_status === "active" || tenant.billing_status === "trialing"}/>
          <div style={{ marginTop: 14 }}><Link href="/dashboard/settings" className="btn btn-secondary btn-small" style={{ width: "100%" }}><Settings size={14}/> Paramètres de l’espace</Link></div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head"><div><h2>Incidents</h2><span>À traiter ou résoudre</span></div><Link className="btn btn-secondary btn-small" href="/dashboard/incidents">Tout afficher</Link></div>
          {incidents.length ? <div style={{ display: "grid", gap: 9 }}>{incidents.map((item: any) => <div className="incident-card" key={item.id}><div className="incident-icon"><AlertTriangle size={17}/></div><div className="incident-body"><strong>{item.title}</strong><span>{String(item.severity).toUpperCase()} · {new Date(item.created_at).toLocaleString("fr-FR")}</span></div><span className={item.severity === "critical" ? "badge badge-danger" : item.severity === "high" ? "badge badge-warning" : "badge badge-neutral"}>{item.status}</span></div>)}</div> : <div className="empty-state"><CheckCircle2 size={24} style={{ marginBottom: 10 }}/><strong>Tout est calme</strong><p>Aucun incident ouvert.</p><Link className="btn btn-secondary btn-small" href="/dashboard/alerts">Configurer les règles</Link></div>}
        </section>

        <section className="panel">
          <div className="panel-head"><div><h2>Présence</h2><span>Premières apparitions aujourd’hui</span></div><Link className="btn btn-secondary btn-small" href="/dashboard/attendance">Ouvrir</Link></div>
          {sessions.length ? sessions.slice(0, 6).map((s: any) => <div className="person-row" key={s.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--line)" }}><div className="person-avatar">{String(s.identity_id).slice(0, 2).toUpperCase()}</div><div style={{ flex: 1 }}><strong>ID {String(s.identity_id).slice(0, 8)}</strong><div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{new Date(s.first_seen_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} → {new Date(s.last_seen_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div></div><span className="badge badge-success">présent</span></div>) : <div className="empty-state"><Users size={24} style={{ marginBottom: 10 }}/><strong>Aucun présent</strong><p>La présence apparaît après une identification.</p><Link className="btn btn-secondary btn-small" href="/dashboard/people">Ajouter du personnel</Link></div>}
        </section>
      </div>

      <ModuleGrid />
    </div>
  );
}

function ModuleGrid() {
  const items = [
    ["/dashboard/cameras", "Caméras", "Sources vidéo et zones", "Ajouter une caméra"],
    ["/dashboard/people", "Personnel", "Identités et enrôlement", "Importer des employés"],
    ["/dashboard/visitors", "Visiteurs", "Pré-enregistrement et accès", "Gérer les visiteurs"],
    ["/dashboard/incidents", "Incidents", "Traitement et historique", "Ouvrir les incidents"],
    ["/dashboard/edge", "Agents de site", "Connexion au réseau local", "Installer un agent"],
    ["/dashboard/analytics", "Analytique", "Tendances et pilotage", "Voir les tendances"]
  ];

  return <section className="module-grid section-card">
    {items.map(([href, title, text, action]) => (
      <Link key={href} href={href} className="module-card">
        <div>
          <strong>{title}</strong>
          <span>{text}</span>
        </div>
        <ArrowRight size={16}/>
        <small>{action}</small>
      </Link>
    ))}
  </section>;
}

function Kpi({ icon, label, value, hint, danger }: { icon: React.ReactNode; label: string; value: number; hint: string; danger?: boolean }) {
  return <div className="kpi-card"><div className="kpi-top"><span>{icon}</span><span className="kpi-trend">{danger ? "Attention" : "Live"}</span></div><div className="kpi-value">{value}</div><div className="kpi-label">{label}</div><div className="muted" style={{ fontSize: 10, marginTop: 6 }}>{hint}</div></div>;
}
function HealthRow({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid var(--line)" }}><span style={{ color: ok ? "var(--accent)" : "var(--warning)" }}>{icon}</span><span style={{ flex: 1, fontSize: 12 }}>{label}</span><strong style={{ fontSize: 11 }}>{value}</strong>{ok ? <CheckCircle2 size={14} color="var(--accent)"/> : <Clock3 size={14} color="var(--warning)"/>}</div>;
}
