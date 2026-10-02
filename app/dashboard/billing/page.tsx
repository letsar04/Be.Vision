import { requireWorkspace } from "../../../lib/workspace";
import { BillingManager } from "../../../components/BillingManager";
export default async function BillingPage(){const context=await requireWorkspace();if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>Abonnement</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;return <div className="page-wrap"><BillingManager tenant={context.tenant}/></div>}
