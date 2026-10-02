
export type CatalogDataset = {
  id: string;
  name: string;
  title?: string | null;
  notes?: string | null;
  metadata_modified?: string | null;
  organization?: { name?: string | null; title?: string | null } | null;
  tags?: Array<{ name?: string | null }>;
  resources?: Array<{
    id: string;
    name?: string | null;
    format?: string | null;
    mimetype?: string | null;
    url?: string | null;
    datastore_active?: boolean;
    datastore_type?: string | null;
    last_modified?: string | null;
    metadata_modified?: string | null;
  }>;
};

const UA = "Be.Vision-Federated-Data/1.0";

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "user-agent": UA,
      accept: "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(\`HTTP \${response.status} sur \${url}\`);
  return response.json();
}

export async function ckanPage(baseUrl: string, start: number, rows: number) {
  const url = new URL(baseUrl.replace(/\/$/, "") + "/api/3/action/package_search");
  url.searchParams.set("q", "*:*");
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("start", String(start));
  const payload = await jsonRequest(url.toString());
  if (!payload?.success) throw new Error("Réponse CKAN invalide.");
  return payload.result as { count?: number; results?: CatalogDataset[] };
}

export async function discoverOpenDataForAfricaCatalog(baseUrl = "https://burkinafaso.opendataforafrica.org") {
  const payload = await jsonRequest(
    baseUrl.replace(/\/$/, "") + "/api/1.0/meta/dataset",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    }
  );

  if (!Array.isArray(payload)) throw new Error("Réponse OpenDataForAfrica invalide.");

  const datasets: CatalogDataset[] = payload
    .filter((item: any) => item && item.id)
    .map((item: any) => ({
      id: String(item.id),
      name: String(item.name || item.title || item.id),
      title: String(item.name || item.title || item.id),
      notes: item.description || item.notes || null,
      metadata_modified: item.modified || item.lastModified || null,
      organization: {
        name: "INSD",
        title: "Institut national de la statistique et de la démographie"
      },
      tags: Array.isArray(item.tags)
        ? item.tags.map((tag: any) => ({ name: String(tag?.name || tag) }))
        : [],
      resources: [{
        id: String(item.id),
        name: String(item.name || item.title || item.id),
        format: "API",
        mimetype: "application/json",
        url: baseUrl.replace(/\/$/, "") + "/" + encodeURIComponent(String(item.id)),
        datastore_active: false,
        metadata_modified: item.modified || item.lastModified || null
      }]
    }));

  return datasets;
}

export async function openDataForAfricaDataset(baseUrl: string, datasetId: string) {
  return jsonRequest(
    baseUrl.replace(/\/$/, "") + "/api/1.0/meta/dataset/" + encodeURIComponent(datasetId)
  );
}
