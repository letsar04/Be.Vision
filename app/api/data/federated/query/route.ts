import { NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/supabase-server";
import { getApiContext } from "../../../../lib/api-auth";
import { remoteResourceOperation } from "../../../../../lib/federated-open-data";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await getApiContext();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const resourceId = String(body.resourceId || "");
    const operation = String(body.operation || "preview") as "preview" | "count" | "top" | "aggregate";
    const column = body.column ? String(body.column) : undefined;
    const metric = (body.metric || "count") as "count" | "sum" | "avg" | "min" | "max";

    if (!resourceId) return NextResponse.json({ error: "resourceId requis." }, { status: 400 });

    const supabase = await createServerClient();
    const { data: resource, error } = await supabase
      .from("federated_data_resources")
      .select("id,external_id,url,datastore_active,dataset_id")
      .eq("id", resourceId)
      .single();

    if (error || !resource) return NextResponse.json({ error: "Ressource introuvable." }, { status: 404 });

    const { data: dataset } = await supabase
      .from("federated_datasets")
      .select("id,source_id")
      .eq("id", resource.dataset_id)
      .single();

    if (!dataset) return NextResponse.json({ error: "Dataset introuvable." }, { status: 404 });

    const { data: source } = await supabase
      .from("federated_data_sources")
      .select("id,base_url,connector_type,enabled")
      .eq("id", dataset.source_id)
      .single();

    if (!source?.enabled) return NextResponse.json({ error: "Source distante indisponible." }, { status: 503 });

    const result = await remoteResourceOperation(source.base_url, resource, operation, column, metric);
    return NextResponse.json({ ok: true, result, persisted: false });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Opération distante impossible." }, { status: 400 });
  }
}
