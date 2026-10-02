import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase-admin";
import { ckanAction, type CkanDataset } from "../../../../lib/federated-open-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (expected && provided !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = createAdminClient();
    const baseUrl = process.env.BODI_CKAN_URL || "https://www.data.gov.bf";

    const source = await db
      .from("federated_data_sources")
      .upsert({ name: "Burkina Faso Open Data", connector_type: "ckan", base_url: baseUrl, enabled: true }, { onConflict: "base_url" })
      .select("id")
      .single();

    if (source.error || !source.data) throw source.error || new Error("Source BODI indisponible.");

    const result = await ckanAction<{ count: number; results: CkanDataset[] }>(
      baseUrl,
      "package_search",
      { q: "*:*", rows: 50, start: 0, sort: "metadata_modified desc" }
    );

    const now = new Date().toISOString();
    const datasets = result.results || [];

    const datasetRows = datasets.map(dataset => ({
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

    if (datasetRows.length) {
      const saved = await db.from("federated_datasets").upsert(datasetRows, { onConflict: "source_id,external_id" }).select("id,external_id");
      if (saved.error) throw saved.error;

      const ids = new Map((saved.data || []).map((row: any) => [row.external_id, row.id]));
      const resourceRows = datasets.flatMap(dataset => {
        const datasetId = ids.get(dataset.id || dataset.name);
        if (!datasetId) return [];
        return (dataset.resources || []).filter(resource => resource.id && resource.url).map(resource => ({
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
        const resources = await db.from("federated_data_resources").upsert(resourceRows, { onConflict: "dataset_id,external_id" });
        if (resources.error) throw resources.error;
      }
    }

    await db.from("federated_data_sources").update({ last_sync_at: now, updated_at: now }).eq("id", source.data.id);

    return NextResponse.json({
      ok: true,
      datasets: datasets.length,
      recentlyUpdated: true,
      synced_at: now
    });
  } catch (error) {
    console.error("[cron/data-catalog] failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Synchronisation automatique échouée." }, { status: 502 });
  }
}
