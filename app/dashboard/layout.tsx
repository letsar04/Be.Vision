import { requireWorkspace } from "../../lib/workspace";
import { DashboardShell } from "../../components/DashboardShell";

export default async function DashboardLayout({children}:{children:React.ReactNode}){
  const context=await requireWorkspace();
  return <DashboardShell tenantName={context.tenant?.name||"Espace à configurer"} plan={context.tenant?.plan||"starter"} userEmail={context.user.email||"utilisateur"} hasWorkspace={Boolean(context.tenant&&context.membership)}>{children}</DashboardShell>;
}
