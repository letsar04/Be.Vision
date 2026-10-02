import { NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/supabase-server";
import { getApiContext } from "../../../../../lib/api-auth";
import { ckanAction, discoverCkanCatalog, type CkanDataset } from "../../../../../lib/federated-open-data";

export const runtime = "nodejs";

const DEFAULT_BODI_URL = process.env.BODI_CKAN_URL || "https://www.data.gov.bf";

export async function POST() {
  const auth = await getApiContext();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServerClient();
  const session = await supabase.auth.getUser();
  if (session.error || !session.data.user) {
    return NextResponse.json({ error: "Session utilisateur introuvable." }, { status: 401 });
  }
  const db = supabase;
  const started = new Date().toISOString();
  const source = await db
    .from("federated_data_sources")
    .upsert({ name: "Burkina Faso Open Data", connector_type: "ckan", base_url: DEFAULT_BODI_URL, enabled: true }, { onConflict: "base_url" })
    .select("id,base_url")
    .single();

  if (source.error || !source.data) return NextResponse.json({ error: source.error?.message || "Source BODI indisponible." }, { status: 500 });

  const run = await db.from("federated_sync_runs").insert({ source_id: source.data.id, status: "running", started_at: started }).select("id").single();
  if (run.error || !run.data) return NextResponse.json({ error: run.error?.message || "Impossible de journaliser la synchronisation." }, { status: 500 });

  try {
    const catalog = await discoverCkanCatalog(source.data.base_url, 100);
    const now = new Date().toISOString();
    let resourcesSeen = 0;

    for (const dataset of catalog as CkanDataset[]) {
      const org = dataset.organization?.title || dataset.organization?.name || null;
      const { data: savedDataset, error: datasetError } = await db
        .from("federated_datasets")
        .upsert({
          source_id: source.data.id,
          external_id: dataset.id || dataset.name,
          name: dataset.name,
          title: dataset.title || dataset.name,
          description: dataset.notes || null,
          organization: org,
          tags: (dataset.tags || []).map(tag => tag?.name).filter(Boolean),
          metadata_modified: dataset.metadata_modified || null,
          metadata: dataset,
          active: true,
          last_seen_at: now,
          updated_at: now
        }, { onConflict: "source_id,external_id" })
        .select("id")
        .single();

      if (datasetError || !savedDataset) throw datasetError || new Error("Dataset BODI non enregistré.");

      const resources = dataset.resources || [];
      resourcesSeen += resources.length;

      for (const resource of resources) {
        if (!resource.id || !resource.url) continue;
        const resourceUpdate = await db
          .from("federated_data_resources")
          .upsert({
            dataset_id: savedDataset.id,
            external_id: resource.id,
            name: resource.name || resource.id,
            format: resource.format || null,
            mimetype: resource.mimetype || null,
            url: resource.url,
            datastore_active: Boolean(resource.datastore_active),
            datastore_type: resource.datastore_type || null,
            modified_at: resource.last_modified || resource.metadata_modified || null,
            metadata: resource,
            active: true,
            last_seen_at: now,
            updated_at: now
          }, { onConflict: "dataset_id,external_id" });

        if (resourceUpdate.error) throw resourceUpdate.error;
      }

      await db.from("federated_datasets").update({ active: true, last_seen_at: now, updated_at: now }).eq("id", savedDataset.id);
    }

    await db.from("federated_data_sources").update({ last_sync_at: now, updated_at: now }).eq("id", source.data.id);
    await db.from("federated_sync_runs").update({
      status: "success",
      finished_at: now,
      datasets_seen: catalog.length,
      resources_seen: resourcesSeen
    }).eq("id", run.data.id);

    return NextResponse.json({ ok: true, source: source.data.base_url, datasets: catalog.length, resources: resourcesSeen, started_at: started, finished_at: now });
  } catch (error) {
    const finished = new Date().toISOString();
    await db.from("federated_sync_runs").update({
      status: "failed",
      finished_at: finished,
      error: error instanceof Error ? error.message : "Synchronisation BODI échouée."
    }).eq("id", run.data.id);

    return NextResponse.json({ error: error instanceof Error ? error.message : "Synchronisation BODI échouée." }, { status: 502 });
  }
}
