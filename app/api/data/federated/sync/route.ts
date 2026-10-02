
import { NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/supabase-server";
import { getApiContext } from "../../../../../lib/api-auth";
import { ckanPage, discoverOpenDataForAfricaCatalog, type CatalogDataset } from "../../../../../lib/open-data-connectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CKAN_URL = process.env.BODI_CKAN_URL || "https://www.data.gov.bf";
const ODFA_URL = process.env.OPEN_DATA_BURKINA_URL || "https://burkinafaso.opendataforafrica.org";
const MAX_BATCH = 25;

export async function POST(req: Request) {
  const auth = await getApiContext();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServerClient();
  const session = await supabase.auth.getUser();
  if (session.error || !session.data.user) {
    return NextResponse.json({ error: "Session utilisateur introuvable." }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const start = Math.max(0, Number(params.get("start") || 0));
  const limit = Math.min(Math.max(Number(params.get("limit") || MAX_BATCH), 1), MAX_BATCH);

  try {
    let provider: "ckan" | "open_data_for_africa" = "ckan";
    let baseUrl = CKAN_URL;
    let datasets: CatalogDataset[] = [];
    let total = 0;

    try {
      const page = await ckanPage(CKAN_URL, start, limit);
      datasets = page.results || [];
      total = Number(page.count || datasets.length);
    } catch (ckanError) {
      if (start > 0) throw ckanError;
      provider = "open_data_for_africa";
      baseUrl = ODFA_URL;
      datasets = await discoverOpenDataForAfricaCatalog(ODFA_URL);
      total = datasets.length;
    }

    const source = await supabase
      .from("federated_data_sources")
      .upsert({
        name: provider === "ckan" ? "Data.gov.bf · CKAN" : "Open Data Burkina · INSD",
        connector_type: provider,
        base_url: baseUrl,
        enabled: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "base_url" })
      .select("id,base_url")
      .single();

    if (source.error || !source.data) throw source.error || new Error("Source Open Data indisponible.");

    const now = new Date().toISOString();
    const selected = provider === "open_data_for_africa" && start > 0
      ? []
      : datasets;

    if (selected.length) {
      const datasetRows = selected.map(dataset => ({
        source_id: source.data.id,
        external_id: dataset.id || dataset.name,
        name: dataset.name,
        title: dataset.title || dataset.name,
        description: dataset.notes || null,
        organization: dataset.organization?.title || dataset.organization?.name || null,
        tags: (dataset.tags || []).map(tag => tag?.name).filter(Boolean),
        metadata_modified: dataset.metadata_modified || null,
        metadata: dataset,
        active: true,
        last_seen_at: now,
        updated_at: now
      }));

      const saved = await supabase
        .from("federated_datasets")
        .upsert(datasetRows, { onConflict: "source_id,external_id" })
        .select("id,external_id");

      if (saved.error) throw saved.error;

      const ids = new Map((saved.data || []).map((row: any) => [row.external_id, row.id]));
      const resources = selected.flatMap(dataset => {
        const datasetId = ids.get(dataset.id || dataset.name);
        if (!datasetId) return [];

        return (dataset.resources || [])
          .filter(resource => resource.id && resource.url)
          .map(resource => ({
            dataset_id: datasetId,
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
          }));
      });

      if (resources.length) {
        const insertedResources = await supabase
          .from("federated_data_resources")
          .upsert(resources, { onConflict: "dataset_id,external_id" });

        if (insertedResources.error) throw insertedResources.error;
      }
    }

    await supabase
      .from("federated_data_sources")
      .update({ last_sync_at: now, updated_at: now })
      .eq("id", source.data.id);

    const done = provider === "open_data_for_africa" ? total : start + selected.length;
    const complete = provider === "open_data_for_africa"
      ? true
      : selected.length === 0 || done >= total || selected.length < limit;

    return NextResponse.json({
      ok: true,
      provider,
      source: baseUrl,
      start,
      batchSize: selected.length,
      total,
      nextStart: complete ? null : done,
      complete,
      resources: selected.reduce((sum, d) => sum + (d.resources?.length || 0), 0)
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[federated sync] failed", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Synchronisation Open Data impossible.",
      retryable: true
    }, { status: 502 });
  }
}
