import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase-admin";
import { discoverCkanCatalog } from "../../../../lib/federated-open-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (expected && provided !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const baseUrl = process.env.BODI_CKAN_URL || "https://www.data.gov.bf";

  const source = await db
    .from("federated_data_sources")
    .upsert({ name: "Burkina Faso Open Data", connector_type: "ckan", base_url: baseUrl, enabled: true }, { onConflict: "base_url" })
    .select("id")
    .single();

  if (source.error || !source.data) return NextResponse.json({ error: source.error?.message || "Source indisponible." }, { status: 500 });

  const catalog = await discoverCkanCatalog(baseUrl, 100);
  const now = new Date().toISOString();

  for (const dataset of catalog) {
    const saved = await db.from("federated_datasets").upsert({
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
    }, { onConflict: "source_id,external_id" }).select("id").single();

    if (saved.error || !saved.data) throw saved.error || new Error("Dataset impossible à indexer.");

    for (const resource of dataset.resources || []) {
      if (!resource.id || !resource.url) continue;
      const result = await db.from("federated_data_resources").upsert({
        dataset_id: saved.data.id,
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

      if (result.error) throw result.error;
    }
  }

  await db.from("federated_data_sources").update({ last_sync_at: now, updated_at: now }).eq("id", source.data.id);

  return NextResponse.json({ ok: true, datasets: catalog.length, synced_at: now });
}
