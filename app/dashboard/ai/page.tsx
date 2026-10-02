import { createServerClient } from "../../../lib/supabase-server";
import { requireWorkspace, withTimeout } from "../../../lib/workspace";
import { AiQualityManager } from "../../../components/AiQualityManager";

export default async function AiPage(){
  const context=await requireWorkspace();
  if(!context.tenant||!context.membership)return <div className="page-wrap"><h1>IA & qualité</h1><p className="muted">Finalisez d’abord l’espace entreprise.</p></div>;
  const s=await createServerClient();
  const q=await withTimeout(Promise.all([
    s.from("learning_examples").select("id,example_id,task,source_event_id,label,feedback,review_status,created_at").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false}).limit(80),
    s.from("model_versions").select("id,model_id,version,status,task,dataset_version,metrics,created_at").eq("tenant_id",context.tenant.id).order("created_at",{ascending:false}).limit(20),
    s.from("evaluation_results").select("id,model_id,version,evaluation_set,metrics,passed,evaluated_at").eq("tenant_id",context.tenant.id).order("evaluated_at",{ascending:false}).limit(20)
  ]),7000);
  return <div className="page-wrap"><AiQualityManager initialExamples={q[0].data||[]} models={q[1].data||[]} evaluations={q[2].data||[]}/></div>;
}
