import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { PeopleManager } from "../../../components/PeopleManager";

export default async function PeoplePage() {
  const context = await requireWorkspace();

  if (!context.tenant || !context.membership) {
    return <div className="page-wrap"><h1>Personnel</h1><p className="muted">Votre espace est en cours de préparation.</p></div>;
  }

  const s = await createServerClient();
  const q = await withTimeout(
    s.from("identities")
      .select("id,display_name,external_id,identity_type,status,metadata,created_at")
      .eq("tenant_id", context.tenant.id)
      .order("display_name"),
    7000
  );

  return (
    <div className="page-wrap">
      <PeopleManager
        initialPeople={q.data || []}
        engineConfigured={Boolean(process.env.FACECOMPARE_API_URL)}
      />
    </div>
  );
}
