export type CkanResource = {
  id: string;
  name?: string | null;
  format?: string | null;
  mimetype?: string | null;
  url?: string | null;
  datastore_active?: boolean;
  datastore_type?: string | null;
  last_modified?: string | null;
  metadata_modified?: string | null;
};

export type CkanDataset = {
  id: string;
  name: string;
  title?: string | null;
  notes?: string | null;
  metadata_modified?: string | null;
  organization?: { name?: string | null; title?: string | null } | null;
  tags?: Array<{ name?: string | null }>;
  resources?: CkanResource[];
};

const UA = "Be.Vision-Federated-Data/1.0";

export function ckanApi(baseUrl: string, action: string) {
  return baseUrl.replace(/\/$/, "") + "/api/3/action/" + action;
}

export async function ckanAction<T = any>(baseUrl: string, action: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(ckanApi(baseUrl, action));
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`CKAN ${action}: HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (!payload?.success) {
    const err = payload?.error;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err || { message: "Réponse CKAN invalide" }));
  }

  return payload.result as T;
}

export async function discoverCkanCatalog(baseUrl: string, pageSize = 100) {
  const datasets: CkanDataset[] = [];
  let start = 0;

  while (true) {
    const result = await ckanAction<{ count?: number; results?: CkanDataset[] }>(
      baseUrl,
      "package_search",
      { q: "*:*", rows: pageSize, start }
    );

    const page = result.results || [];
    datasets.push(...page);

    if (page.length === 0 || page.length < pageSize) break;
    start += pageSize;

    if (result.count && start >= result.count) break;
  }

  return datasets;
}

function quoteIdentifier(value: string) {
  if (!/^[A-Za-z0-9_\-.:]+$/.test(value)) {
    throw new Error("Identifiant de colonne non autorisé.");
  }
  return '"' + value.replace(/"/g, '""') + '"';
}

export async function ckanDatastoreRequest(baseUrl: string, resourceId: string, params: Record<string, string | number> = {}) {
  return ckanAction<any>(baseUrl, "datastore_search", { resource_id: resourceId, ...params });
}

export async function ckanDatastoreSql(baseUrl: string, sql: string) {
  return ckanAction<any>(baseUrl, "datastore_search_sql", { sql });
}

export async function remoteResourceOperation(
  baseUrl: string,
  resource: { external_id: string; url: string; datastore_active: boolean },
  operation: "preview" | "count" | "top" | "aggregate",
  column?: string,
  metric: "count" | "sum" | "avg" | "min" | "max" = "count"
) {
  if (!resource.datastore_active) {
    throw new Error("Cette ressource n’expose pas de DataStore distant. Be.Vision ne la stocke pas ; une source API/DataStore ou Parquet est nécessaire pour les opérations distantes avancées.");
  }

  if (operation === "preview") {
    const result = await ckanDatastoreRequest(baseUrl, resource.external_id, { limit: 50});
    return { type: "preview", columns: result?.fields || [], rows: result?.records || [], total: result?.total ?? null };
  }

  if (operation === "count") {
    const result = await ckanDatastoreRequest(baseUrl, resource.external_id, { limit: 0 });
    return { type: "count", count: result?.total ?? 0 };
  }

  if (!column) throw new Error("Choisissez une colonne pour cette opération.");

  const qColumn = quoteIdentifier(column);

  if (operation === "top") {
    const sql = `SELECT ${qColumn} AS value, COUNT(*) AS count
                  FROM "${resource.external_id}"
                  GROUP BY ${qColumn}
                  ORDER BY count DESC
                  LIMIT 10`;
    try {
      const result = await ckanDatastoreSql(baseUrl, sql);
      return { type: "top", column, rows: result?.records || [] };
    } catch {
      const result = await ckanDatastoreRequest(baseUrl, resource.external_id, { limit: 1000 });
      const counts = new Map<string, number>();
      for (const row of result?.records || []) {
        const key = String(row?.[column] ?? "Non renseigné");
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return {
        type: "top",
        column,
        rows: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([value, count]) => ({ value, count }))
      };
    }
  }

  const fn = metric.toUpperCase();
  if (!["COUNT", "SUM", "AVG", "MIN", "MAX"].includes(fn)) throw new Error("Agrégat non autorisé.");

  const expression = fn === "COUNT" ? "COUNT(*)" : `${fn}(${qColumn})`;
  const sql = `SELECT ${expression} AS value FROM "${resource.external_id}"`;

  try {
    const result = await ckanDatastoreSql(baseUrl, sql);
    return { type: "aggregate", column, metric, value: result?.records?.[0]?.value ?? null };
  } catch {
    throw new Error("Le DataStore CKAN n’autorise pas cette agrégation distante sur cette ressource.");
  }
}
