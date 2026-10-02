import { requireWorkspace } from "../../../lib/workspace";
import { createServerClient } from "../../../lib/supabase-server";
import { FederatedDataWorkbench } from "../../../components/FederatedDataWorkbench";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const ctx = await requireWorkspace();
  if (ctx.error || !ctx.tenant) {
    return <div className="page-wrap"><div className="state-icon danger">!</div><h1>Espace indisponible</h1><p>{ctx.error || "Espace indisponible."}</p></div>;
  }

  const supabase = await createServerClient();
  const [{ data: datasets }, { data: source }] = await Promise.all([
    supabase
      .from("federated_datasets")
      .select("id,external_id,name,title,description,organization,tags,metadata_modified,active,last_seen_at,source_id")
      .eq("active", true)
      .order("title", { ascending: true })
      .limit(50),
    supabase
      .from("federated_data_sources")
      .select("last_sync_at")
      .eq("base_url", process.env.BODI_CKAN_URL || "https://www.data.gov.bf")
      .maybeSingle()
  ]);

  const ids = (datasets || []).map((d: any) => d.id);
  const resources = ids.length
    ? (await supabase.from("federated_data_resources").select("id,dataset_id,external_id,name,format,mimetype,url,datastore_active,datastore_type,modified_at,active").in("dataset_id", ids).eq("active", true)).data || []
    : [];

  const grouped = new Map<string, any[]>();
  for (const resource of resources) {
    const list = grouped.get(resource.dataset_id) || [];
    list.push(resource);
    grouped.set(resource.dataset_id, list);
  }

  const initialDatasets = (datasets || []).map((dataset: any) => ({ ...dataset, resources: grouped.get(dataset.id) || [] }));

  return <FederatedDataWorkbench initialDatasets={initialDatasets} lastSyncAt={source?.last_sync_at} />;
}
