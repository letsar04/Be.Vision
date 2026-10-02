import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace } from "../../../lib/workspace";
import { WorkspaceSettings } from "../../../components/WorkspaceSettings";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const context = await requireWorkspace();
  const supabase = await createServerClient();

  let site: any = null;
  if (context.tenant) {
    const result = await supabase
      .from("sites")
      .select("id,name,address,timezone,status")
      .eq("tenant_id", context.tenant.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    site = result.data;
  }

  return (
    <div className="page-wrap">
      <div className="settings-header">
        <div>
          <div className="eyebrow">Workspace</div>
          <h1>Paramètres de l’espace</h1>
          <p>Configurez les informations de votre entreprise et gardez les réglages avancés séparés du centre de contrôle.</p>
        </div>
        <div className="settings-status">{context.tenant?.setup_completed ? "Configuration terminée" : "Configuration initiale"}</div>
      </div>
      <WorkspaceSettings
        initialTenant={context.tenant}
        initialSite={site}
      />
    </div>
  );
}
