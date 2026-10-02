"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Database, ExternalLink, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";

type Resource = {
  id: string;
  external_id: string;
  name?: string;
  format?: string;
  mimetype?: string;
  url: string;
  datastore_active: boolean;
};

type Dataset = {
  id: string;
  external_id: string;
  name: string;
  title?: string;
  description?: string;
  organization?: string;
  tags?: string[];
  metadata_modified?: string;
  resources: Resource[];
};

export function FederatedDataWorkbench({ initialDatasets, lastSyncAt }: { initialDatasets: Dataset[]; lastSyncAt?: string | null }) {
  const [datasets, setDatasets] = useState(initialDatasets);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Dataset | null>(initialDatasets[0] || null);
  const [resource, setResource] = useState<Resource | null>(initialDatasets[0]?.resources?.find(r => r.datastore_active) || initialDatasets[0]?.resources?.[0] || null);
  const [operation, setOperation] = useState<"preview"|"count"|"top"|"aggregate">("preview");
  const [column, setColumn] = useState("");
  const [metric, setMetric] = useState<"count"|"sum"|"avg"|"min"|"max">("count");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [message, setMessage] = useState("");

  const resources = selected?.resources || [];
  const candidateColumns = useMemo(() => {
    if (!result?.result?.columns) return [];
    return result.result.columns.map((x: any) => x.id || x.field_name).filter(Boolean);
  }, [result]);

  async function search() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/data/federated/catalog?q=" + encodeURIComponent(query));
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Recherche impossible.");
      setDatasets(body.data || []);
      setSelected(body.data?.[0] || null);
      const firstResource = body.data?.[0]?.resources?.find((x: Resource) => x.datastore_active) || body.data?.[0]?.resources?.[0] || null;
      setResource(firstResource);
      setResult(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Recherche impossible.");
    } finally { setBusy(false); }
  }

  async function sync() {
    setSyncBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/data/federated/sync", { method: "POST" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Synchronisation impossible.");
      setMessage(`Catalogue synchronisé : ${body.datasets.toLocaleString("fr-FR")} datasets, ${body.resources.toLocaleString("fr-FR")} ressources.`);
      await search();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Synchronisation impossible.");
    } finally { setSyncBusy(false); }
  }

  async function operate() {
    if (!resource) return;
    setBusy(true);
    setResult(null);
    setMessage("");
    try {
      const r = await fetch("/api/data/federated/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: resource.id, operation, column: column || undefined, metric })
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Opération distante impossible.");
      setResult(body);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Opération distante impossible.");
    } finally { setBusy(false); }
  }

  return <div className="page-wrap">
    <div className="page-title">
      <div>
        <div className="eyebrow">Data Intelligence · mode fédéré</div>
        <h1>Open Data Burkina</h1>
        <p>Le catalogue est synchronisé ; les données restent chez leur fournisseur. Be.Vision interroge la source seulement lorsque vous lancez une opération.</p>
      </div>
      <button className="btn btn-primary" onClick={() => void sync()} disabled={syncBusy}>
        {syncBusy ? <Loader2 size={15}/> : <RefreshCw size={15}/>} Synchroniser le catalogue
      </button>
    </div>

    <div className="kpi-grid">
      <div className="kpi-card"><div className="kpi-top"><Database size={17}/><span>Fédération</span></div><div className="kpi-value">{datasets.length}</div><div className="kpi-label">Datasets affichés</div><div className="muted" style={{fontSize:10,marginTop:6}}>Métadonnées uniquement</div></div>
      <div className="kpi-card"><div className="kpi-top"><RefreshCw size={17}/><span>Catalogue</span></div><div className="kpi-value">●</div><div className="kpi-label">Synchronisation automatique</div><div className="muted" style={{fontSize:10,marginTop:6}}>{lastSyncAt ? new Date(lastSyncAt).toLocaleString("fr-FR") : "Jamais synchronisé"}</div></div>
      <div className="kpi-card"><div className="kpi-top"><Sparkles size={17}/><span>IA</span></div><div className="kpi-value">0 B</div><div className="kpi-label">Données brutes stockées</div><div className="muted" style={{fontSize:10,marginTop:6}}>Mode distant</div></div>
    </div>

    <section className="panel">
      <div className="panel-head"><div><h2>Catalogue national</h2><span>Rechercher dans les métadonnées</span></div></div>
      <div style={{display:"flex",gap:8}}>
        <input className="input" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void search()}} placeholder="Éducation, santé, agriculture, budget…"/>
        <button className="btn btn-secondary" onClick={() => void search()} disabled={busy}><Search size={15}/> Rechercher</button>
      </div>
    </section>

    <div className="dashboard-grid" style={{marginTop:18}}>
      <section className="panel">
        <div className="panel-head"><div><h2>Datasets</h2><span>{datasets.length} résultat(s)</span></div></div>
        {datasets.length ? <div style={{display:"grid",gap:8,maxHeight:560,overflowY:"auto"}}>{datasets.map(d=><button key={d.id} className={"dataset-list-item"+(selected?.id===d.id?" active":"")} onClick={()=>{setSelected(d);setResource(d.resources?.find(r=>r.datastore_active)||d.resources?.[0]||null);setResult(null)}}><span><strong>{d.title || d.name}</strong><small>{d.organization || "BODI"} · {d.resources.length} ressource(s)</small></span><ArrowUpRight size={15}/></button>)}</div> : <div className="empty-state"><Database size={24}/><strong>Catalogue vide</strong><p>Lancez une synchronisation pour récupérer les métadonnées BODI.</p></div>}
      </section>

      <section className="panel">
        {selected ? <><div className="panel-head"><div><h2>{selected.title || selected.name}</h2><span>{selected.organization || "Burkina Faso Open Data"}</span></div><ExternalLink size={17}/></div><p className="muted" style={{lineHeight:1.7}}>{selected.description || "Aucune description fournie."}</p>
          <div className="resource-list">{resources.map(r=><button key={r.id} className={"resource-item"+(resource?.id===r.id?" active":"")} onClick={()=>{setResource(r);setResult(null)}}><span><strong>{r.name || r.external_id}</strong><small>{r.format || r.mimetype || "fichier"} · {r.datastore_active ? "DataStore distant" : "Source distante"}</small></span><ArrowUpRight size={14}/></button>)}</div>

          {resource && <div className="federated-query-box">
            <div className="eyebrow">Opération distante</div>
            <h3>{resource.datastore_active ? "Interroger sans télécharger le dataset" : "Source distante non requêtable avancée"}</h3>
            <div className="form-grid">
              <Field label="Opération"><select value={operation} onChange={e=>{setOperation(e.target.value as any);setResult(null)}}><option value="preview">Aperçu</option><option value="count">Compter</option><option value="top">Top valeurs</option><option value="aggregate">Agrégation</option></select></Field>
              {operation !== "count" && operation !== "preview" && <Field label="Colonne"><input value={column} onChange={e=>setColumn(e.target.value)} placeholder="Ex. region"/></Field>}
              {operation === "aggregate" && <Field label="Mesure"><select value={metric} onChange={e=>setMetric(e.target.value as any)}><option value="count">COUNT</option><option value="sum">SUM</option><option value="avg">AVG</option><option value="min">MIN</option><option value="max">MAX</option></select></Field>}
            </div>
            <button className="btn btn-primary" onClick={()=>void operate()} disabled={busy || !resource.datastore_active}>
              {busy ? <Loader2 size={15}/> : <Sparkles size={15}/>} {resource.datastore_active ? "Exécuter sur la source" : "DataStore requis"}
            </button>
            {result?.result?.rows && <div className="remote-result">{JSON.stringify(result.result.rows.slice(0,50), null, 2)}</div>}
            {result?.result?.count !== undefined && <div className="remote-result"><strong>{result.result.count.toLocaleString("fr-FR")}</strong> lignes</div>}
            {result?.result?.value !== undefined && <div className="remote-result"><strong>{String(result.result.value)}</strong></div>}
            {message && <div className="auth-status info" style={{marginTop:12}}>{message}</div>}
          </div>}
        </> : <div className="empty-state"><Search size={24}/><strong>Sélectionnez un dataset</strong><p>Les données restent à distance ; seule la requête utile revient dans Be.Vision.</p></div>}
      </section>
    </div>
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) {
  return <div className="form-field"><label>{label}</label>{children}</div>;
}
