import { requireWorkspace } from "../../lib/workspace";
import { DashboardShell } from "../../components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireWorkspace();

  return (
    <DashboardShell
      tenantName={context.tenant?.name || "Mon espace"}
      plan={context.tenant?.plan || "starter"}
      userEmail={context.user.email || "utilisateur"}
      hasWorkspace={Boolean(context.tenant && context.membership)}
      setupCompleted={Boolean(context.tenant?.setup_completed)}
    >
      {children}
    </DashboardShell>
  );
}
