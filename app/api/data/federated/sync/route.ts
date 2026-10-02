import { NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/supabase-server";
import { getApiContext } from "../../../../../lib/api-auth";
import { ckanAction, type CkanDataset } from "../../../../../lib/federated-open-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BODI_URL = process.env.BODI_CKAN_URL || "https://www.data.gov.bf";
const MAX_BATCH = 25;

export async function POST(req: Request) {
  const auth = await getApiContext();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createServerClient();
  const session = await supabase.auth.getUser();
  if (session.error || !session.data.user) {
    return NextResponse.json({ error: "Session utilisateur introuvable." }, { status: 401 });
  }

  const url = new URL(req.url);
  const start = Math.max(0, Number(url.searchParams.get("start") || 0));
  const requestedLimit = Number(url.searchParams.get("limit") || MAX_BATCH);
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_BATCH);

  const started = new Date().toISOString();

  try {
    const sourceResult = await supabase
      .from("federated_data_sources")
      .upsert({
        name: "Burkina Faso Open Data",
        connector_type: "ckan",
        base_url: DEFAULT_BODI_URL,
        enabled: true
      }, { onConflict: "base_url" })
      .select("id,base_url,last_sync_at")
      .single();

    if (sourceResult.error || !sourceResult.data) {
      return NextResponse.json({ error: sourceResult.error?.message || "Source BODI indisponible." }, { status: 500 });
    }

    const result = await ckanAction<{ count: number; results: CkanDataset[] }>(
      sourceResult.data.base_url,
      "package_search",
      { q: "*:*", rows: limit, start }
    );

    const catalog = result.results || [];
    const now = new Date().toISOString();

    if (catalog.length) {
      const datasetRows = catalog.map(dataset => ({
        source_id: sourceResult.data.id,
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

      const idByExternal = new Map((saved.data || []).map((row: any) => [row.external_id, row.id]));

      const resourceRows = catalog.flatMap(dataset => {
        const datasetId = idByExternal.get(dataset.id || dataset.name);
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

      if (resourceRows.length) {
        const resources = await supabase
          .from("federated_data_resources")
          .upsert(resourceRows, { onConflict: "dataset_id,external_id" });

        if (resources.error) throw resources.error;
      }
    }

    const total = Number(result.count || 0);
    const nextStart = start + catalog.length;
    const complete = catalog.length === 0 || nextStart >= total || catalog.length < limit;

    await supabase
      .from("federated_data_sources")
      .update({ last_sync_at: now, updated_at: now })
      .eq("id", sourceResult.data.id);

    return NextResponse.json({
      ok: true,
      source: sourceResult.data.base_url,
      start,
      batchSize: catalog.length,
      total,
      nextStart: complete ? null : nextStart,
      complete,
      resources: catalog.reduce((sum, dataset) => sum + (dataset.resources?.length || 0), 0),
      started_at: started,
      finished_at: now
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[api/data/federated/sync] failed", error);

    const message = error instanceof Error ? error.message : "Synchronisation BODI échouée.";

    return NextResponse.json({
      error: message,
      start,
      nextStart: start,
      retryable: true
    }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
