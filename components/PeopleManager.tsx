"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Upload,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

type ImportRow = Record<string, string>;
type ImportResult = {
  rowIndex: number;
  external_id: string;
  display_name: string;
  identity_id: string;
  action: "created" | "updated" | "skipped";
  photo?: string | null;
  data?: any;
};

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim() || "";
}

function parseCsv(input: string): ImportRow[] {
  const delimiter = (input.split(/\r?\n/, 1)[0]?.split(";").length || 0) > (input.split(/\r?\n/, 1)[0]?.split(",").length || 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (ch === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }

  if (rows.length < 2) throw new Error("Le fichier CSV doit contenir une ligne d’en-têtes et au moins une ligne d’employé.");

  const headers = rows[0].map((h) => normalizeKey(h));
  if (!headers.includes("matricule") && !headers.includes("externalid")) {
    throw new Error("Colonne obligatoire manquante : matricule (ou external_id).");
  }
  if (!headers.includes("nomcomplet") && !headers.includes("displayname")) {
    throw new Error("Colonne obligatoire manquante : nom_complet (ou display_name).");
  }

  return rows.slice(1).map((values) => {
    const item: ImportRow = {};
    headers.forEach((header, index) => {
      item[header] = (values[index] || "").trim();
    });
    return item;
  });
}

function truthy(value: string) {
  return ["1", "true", "oui", "yes", "o", "y", "vrai"].includes(value.toLowerCase().trim());
}

export function PeopleManager({ initialPeople, engineConfigured }: { initialPeople: any[]; engineConfigured: boolean }) {
  const [people, setPeople] = useState(initialPeople);
  const [form, setForm] = useState({
    display_name: "",
    external_id: "",
    department: "",
    role: "",
    consent_recorded: false,
  });
  const [show, setShow] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [importMode, setImportMode] = useState<"update" | "skip">("update");
  const [importProgress, setImportProgress] = useState("");
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const photoMap = useMemo(() => {
    const map = new Map<string, File>();
    for (const file of photoFiles) {
      const name = normalizeKey(file.name);
      if (name) map.set(name, file);
    }
    return map;
  }, [photoFiles]);

  async function createPerson(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Création impossible");
      setPeople([...people, b.data].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setForm({
        display_name: "",
        external_id: "",
        department: "",
        role: "",
        consent_recorded: false,
      });
      setShow(false);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function enroll(id: string, file: File) {
    if (!engineConfigured) {
      setMessage("Le moteur de vision n’est pas connecté sur cet environnement.");
      return;
    }
    setMessage("");
    const fd = new FormData();
    fd.append("image", file);
    try {
      const r = await fetch("/api/identities/" + id + "/enroll", { method: "POST", body: fd });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Enrôlement impossible");
      setMessage("Empreinte enregistrée. La personne peut maintenant être reconnue par le moteur vision.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Le moteur de vision ne répond pas.");
    }
  }

  function findPhoto(row: ImportRow, files: Map<string, File>) {
    const declared = row.photo || row.photofilename || row.image || row.imagefilename;
    if (declared) return files.get(normalizeKey(declared)) || null;

    const externalId = row.matricule || row.externalid || "";
    const displayName = row.nomcomplet || row.displayname || "";
    return files.get(normalizeKey(externalId)) || files.get(normalizeKey(displayName)) || null;
  }

  async function importEmployees(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) {
      setImportErrors(["Sélectionnez d’abord le fichier CSV."]);
      return;
    }

    setBusy(true);
    setImportSummary(null);
    setImportErrors([]);
    setImportProgress("Lecture du fichier CSV…");

    try {
      const csv = await importFile.text();
      const rows = parseCsv(csv);

      setImportProgress(`Import de ${rows.length} employés dans l’annuaire…`);
      const response = await fetch("/api/identities/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, mode: importMode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Import impossible");

      const results = (body.rows || []) as ImportResult[];
      const failures: string[] = [];
      let enrolled = 0;
      let withoutPhoto = 0;

      const jobs = results.filter((item) => item.action !== "skipped");
      let cursor = 0;

      async function worker() {
        while (cursor < jobs.length) {
          const job = jobs[cursor++];
          const sourceRow = rows[job.rowIndex];
          const photo = findPhoto(sourceRow, photoMap);

          if (!photo) {
            withoutPhoto++;
            continue;
          }

          setImportProgress(`Enrôlement biométrique : ${Math.min(cursor, jobs.length)}/${jobs.length}…`);
          const fd = new FormData();
          fd.append("image", photo);
          try {
            const enrollResponse = await fetch("/api/identities/" + job.identity_id + "/enroll", {
              method: "POST",
              body: fd,
            });
            const enrollBody = await enrollResponse.json();
            if (!enrollResponse.ok) throw new Error(enrollBody.error || "Enrôlement refusé.");
            enrolled++;
          } catch (error) {
            failures.push(`${job.external_id} — ${error instanceof Error ? error.message : "enrôlement échoué"}`);
          }
        }
      }

      await Promise.all([worker(), worker(), worker()]);

      setImportProgress("Actualisation de l’annuaire…");
      const refresh = await fetch("/api/identities");
      const refreshed = await refresh.json();
      if (refresh.ok) setPeople(refreshed.data || []);

      setImportSummary({
        total: body.summary?.total || rows.length,
        created: body.summary?.created || 0,
        updated: body.summary?.updated || 0,
        skipped: body.summary?.skipped || 0,
        enrolled,
        withoutPhoto,
      });
      setImportErrors(failures);
      setMessage(
        failures.length
          ? "Import terminé avec des enrôlements à vérifier."
          : "Import et enrôlement terminés avec succès."
      );
      setImportProgress("");
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : "Import impossible."]);
      setImportProgress("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow">Identités & habilitations</div>
          <h1>Personnel</h1>
          <p>Importez un annuaire complet puis enrôlez les personnes dès que le moteur de vision est disponible.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => { setShowImport(!showImport); setShow(false); }}>
            <UsersRound size={16} /> Importer en masse
          </button>
          <button className="btn btn-primary" onClick={() => { setShow(!show); setShowImport(false); }}>
            <Plus size={16} /> Ajouter une personne
          </button>
        </div>
      </div>

      {!engineConfigured && (
        <div className="dashboard-setup-banner compact" style={{ marginBottom: 14 }}>
          <div className="setup-progress">
            <div className="setup-progress-ring">!</div>
            <div>
              <strong>Moteur biométrique non connecté</strong>
              <span>Les employés peuvent être importés maintenant. L’enrôlement sera activé dès que le moteur FaceCompare sera raccordé à cet environnement.</span>
            </div>
          </div>
          <a className="btn btn-secondary btn-small" href="/dashboard/edge">Voir les agents de site</a>
        </div>
      )}

      {showImport && (
        <form className="panel section-card" onSubmit={importEmployees}>
          <div className="panel-head">
            <div>
              <h2>Import massif des employés</h2>
              <span>CSV + photos → création / mise à jour → enrôlement InsightFace</span>
            </div>
            <FileSpreadsheet size={18} />
          </div>

          <div className="form-grid">
            <Field label="Fichier CSV" full>
              <input required type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
              <span className="muted" style={{ fontSize: 10 }}>
                Colonnes minimales : <strong>matricule</strong> et <strong>nom_complet</strong>.
                La colonne <strong>photo</strong> peut contenir le nom exact du fichier image.
              </span>
            </Field>

            <Field label="Photos des employés" full>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
              />
              <span className="muted" style={{ fontSize: 10 }}>
                Sans colonne photo, Be.Vision cherche automatiquement un fichier dont le nom correspond au matricule.
              </span>
            </Field>

            <Field label="Employés déjà présents">
              <select value={importMode} onChange={(e) => setImportMode(e.target.value as "update" | "skip")}>
                <option value="update">Mettre à jour avec le matricule</option>
                <option value="skip">Ignorer les matricules existants</option>
              </select>
            </Field>

            <div className="form-field" style={{ alignContent: "end" }}>
              <a className="btn btn-secondary" href="/templates/employees-import.csv" download>
                <Download size={14} /> Télécharger le modèle CSV
              </a>
            </div>

            <div className="panel section-card" style={{ gridColumn: "1 / -1", marginTop: 4 }}>
              <strong style={{ fontSize: 12 }}>Format recommandé</strong>
              <p className="muted" style={{ fontSize: 11, lineHeight: 1.6, margin: "7px 0 0" }}>
                <code>matricule,nom_complet,departement,fonction,telephone,email,site,consent_recorded,photo</code>
                <br />
                Exemple : <code>EMP-001,Awa Traore,RH,Assistante,70000000,awa@example.com,Siège,oui,EMP-001.jpg</code>
              </p>
            </div>

            {importProgress && (
              <div className="auth-status info" style={{ gridColumn: "1 / -1" }}>
                {importProgress}
              </div>
            )}

            {importSummary && (
              <div className="health-strip" style={{ gridColumn: "1 / -1" }}>
                <span className="health-pill">✓ {importSummary.created} créé(s)</span>
                <span className="health-pill">✓ {importSummary.updated} mis à jour</span>
                <span className="health-pill">{importSummary.skipped} ignoré(s)</span>
                <span className="health-pill">✓ {importSummary.enrolled} enrôlé(s)</span>
                <span className="health-pill off">{importSummary.withoutPhoto} sans photo</span>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="auth-status" style={{ gridColumn: "1 / -1" }}>
                <strong style={{ display: "block", marginBottom: 6 }}>
                  <AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
                  À vérifier
                </strong>
                <div style={{ display: "grid", gap: 4 }}>
                  {importErrors.slice(0, 20).map((error, index) => <div key={index}>{error}</div>)}
                  {importErrors.length > 20 && <div>… {importErrors.length - 20} autre(s)</div>}
                </div>
              </div>
            )}

            <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowImport(false)} disabled={busy}>
                Annuler
              </button>
              <button className="btn btn-primary" disabled={busy}>
                <Upload size={14} /> {busy ? "Import en cours…" : "Importer et enrôler"}
              </button>
            </div>
          </div>
        </form>
      )}

      {show && <form className="panel section-card" onSubmit={createPerson}>
        <div className="form-grid">
          <Field label="Nom complet" full><input required value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} placeholder="Nom Prénom"/></Field>
          <Field label="Matricule"><input value={form.external_id} onChange={e=>setForm({...form,external_id:e.target.value})} placeholder="EMP-001"/></Field>
          <Field label="Département"><input value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="Production"/></Field>
          <Field label="Fonction"><input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="Responsable"/></Field>
          <label style={{display:"flex",gap:8,alignItems:"center",gridColumn:"1/-1",fontSize:12}}><input type="checkbox" checked={form.consent_recorded} onChange={e=>setForm({...form,consent_recorded:e.target.checked})}/><span>Consentement / base légale enregistré(e) par l’entreprise</span></label>
          <div className="form-actions" style={{gridColumn:"1/-1"}}><button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Annuler</button><button className="btn btn-primary" disabled={busy}>{busy?"Création…":"Créer"}</button></div>
        </div>
      </form>}

      {message && <div className="auth-status" style={{marginTop:12}}>{message}</div>}

      <div className="panel section-card">
        <table className="table">
          <thead><tr><th>Personne</th><th>Organisation</th><th>Biométrie</th><th>Statut</th></tr></thead>
          <tbody>
          {people.map(p=><tr key={p.id}>
            <td><div className="person-row"><div className="person-avatar"><UserRound size={17}/></div><div><strong>{p.display_name}</strong><div className="muted" style={{fontSize:10}}>{p.external_id||"Sans matricule"}</div></div></div></td>
            <td><div>{p.metadata?.department||"—"}</div><div className="muted" style={{fontSize:10}}>{p.metadata?.role||""}</div></td>
            <td>
              {engineConfigured ? (
                <label className="btn btn-secondary btn-small" style={{display:"inline-flex"}}>
                  <Upload size={13}/> Enrôler
                  <input type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void enroll(p.id,f)}}/>
                </label>
              ) : (
                <span className="badge badge-neutral">Moteur hors ligne</span>
              )}
            </td>
            <td><span className="badge badge-success"><CheckCircle2 size={11}/>{p.status}</span></td>
          </tr>)}
          </tbody>
        </table>
        {!people.length && <div className="empty-state"><ShieldCheck size={26}/><strong>Votre annuaire est vide</strong><p>Créez une personne, puis lancez un enrôlement depuis une photo contrôlée.</p></div>}
      </div>
    </div>
  );
}

function Field({label,children,full}:{label:string;children:React.ReactNode;full?:boolean}) {
  return <div className={"form-field"+(full?" full":"")}><label>{label}</label>{children}</div>;
}
