import { redirect } from "next/navigation";
import { requireWorkspace } from "../../lib/workspace";
import { DashboardShell } from "../../components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await requireWorkspace();

  if (!context.tenant || !context.membership) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      tenantName={context.tenant.name}
      plan={context.tenant.plan}
      userEmail={context.user.email || "utilisateur"}
      hasWorkspace={true}
    >
      {children}
    </DashboardShell>
  );
}
