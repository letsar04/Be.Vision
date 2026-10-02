import { NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/supabase-server";
import { requireWorkspace } from "../../../../../lib/workspace";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireWorkspace();
  if (ctx.error || !ctx.tenant) return NextResponse.json({ error: ctx.error || "Espace indisponible" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

  const supabase = await createServerClient();
  let query = supabase
    .from("federated_datasets")
    .select("id,external_id,name,title,description,organization,tags,metadata_modified,active,last_seen_at,source_id")
    .eq("active", true)
    .order("title", { ascending: true })
    .limit(limit);

  if (q) query = query.or(`title.ilike.%${q}%,name.ilike.%${q}%,description.ilike.%${q}%,organization.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const datasetIds = (data || []).map((item: any) => item.id);
  const resources = datasetIds.length
    ? await supabase.from("federated_data_resources").select("id,dataset_id,external_id,name,format,mimetype,url,datastore_active,datastore_type,modified_at,active").in("dataset_id", datasetIds).eq("active", true)
    : { data: [], error: null };

  if (resources.error) return NextResponse.json({ error: resources.error.message }, { status: 500 });

  const grouped = new Map<string, any[]>();
  for (const item of resources.data || []) {
    const list = grouped.get(item.dataset_id) || [];
    list.push(item);
    grouped.set(item.dataset_id, list);
  }

  return NextResponse.json({
    data: (data || []).map((item: any) => ({ ...item, resources: grouped.get(item.id) || [] }))
  });
}
