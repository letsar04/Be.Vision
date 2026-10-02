"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, LockKeyhole, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const AUTH_TIMEOUT = 9000;
// Production deployment marker: Supabase public config is provided by lib/supabase-config.ts.

function withTimeout<T>(promise: Promise<T>, ms = AUTH_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("La connexion à Supabase a pris trop de temps.")), ms)),
  ]);
}

export default function LoginPage() {
  const [signup, setSignup] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/health", { cache: "no-store" }).then((r) => r.json()).then(setHealth).catch(() => null);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const endpoint = signup ? "/api/auth/signup" : "/api/auth/login";
      const payload = signup
        ? {
            email,
            password,
            company_name: companyName.trim() || "Mon entreprise",
            site_name: siteName.trim() || "Siège",
          }
        : { email, password };

      const response = await withTimeout(fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || (signup ? "Impossible de créer le compte." : "Connexion impossible."));

      if (signup && !result.session) {
        setMsg("Compte créé. Vérifiez votre adresse email avant de vous connecter.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Impossible de terminer l'opération.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div>
          <a className="brand-lockup" href="/">
            <span className="brand-mark">B</span>
            <span>Be<span className="brand-dot">.</span>Vision</span>
          </a>
        </div>

        <div className="login-copy">
          <div className="eyebrow">Security operations cloud</div>
          <h1>Votre sécurité physique mérite un vrai centre d’opérations.</h1>
          <p>
            Caméras IP sur site, agent edge, présence, alertes, incidents et analytique :
            Be.Vision transforme les événements vidéo en actions métier exploitables.
          </p>
          <div className="login-points">
            <div className="login-point"><span /> Caméras IP, RTSP et architecture site/edge</div>
            <div className="login-point"><span /> Personnel, présence et historique auditable</div>
            <div className="login-point"><span /> Règles d’alerte, incidents et décisions</div>
            <div className="login-point"><span /> Multi-sites depuis un centre de contrôle</div>
          </div>
        </div>

        <div className="health-strip">
          <HealthPill label="Supabase" ok={health?.checks?.supabase} />
          <HealthPill label="Stripe" ok={health?.checks?.stripe} />
          <HealthPill label="Moteur vision" ok={health?.checks?.facecompare} />
        </div>
      </section>

      <section className="login-panel">
        <div className="auth-card">
          <div className="eyebrow">{signup ? "Création d’espace" : "Accès sécurisé"}</div>
          <h1>{signup ? "Créer l’espace entreprise" : "Connexion"}</h1>
          <p className="auth-sub">
            {signup
              ? "Votre espace démarre avec 14 jours d’essai et une structure prête pour plusieurs sites."
              : "Retrouvez vos caméras, équipes, alertes et opérations."}
          </p>

          <form onSubmit={submit}>
            {signup && (
              <>
                <div className="form-field">
                  <label>Nom de l’entreprise</label>
                  <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex. ACME Industrie" />
                </div>
                <div className="form-field" style={{marginTop:12}}>
                  <label>Site principal</label>
                  <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Ex. Siège / Dépôt / Usine" />
                </div>
              </>
            )}

            <div className="form-field" style={{marginTop:12}}>
              <label>Email professionnel</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.com" autoComplete="email" />
            </div>

            <div className="form-field" style={{marginTop:12}}>
              <label>Mot de passe</label>
              <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={signup ? "new-password" : "current-password"} />
            </div>

            <button className="btn btn-primary" style={{width:"100%",marginTop:18}} disabled={loading}>
              {loading ? "Connexion en cours…" : signup ? "Créer mon espace" : "Ouvrir le centre de contrôle"}
            </button>
          </form>

          {msg && <div className="auth-status">{msg}</div>}

          <div className="auth-switch">
            {signup ? "Vous avez déjà un espace ?" : "Pas encore d’espace ?"}
            <button type="button" onClick={() => { setSignup(!signup); setMsg(""); }}>
              {signup ? " Se connecter" : " Créer un compte"}
            </button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:22}}>
            <MiniProof icon={<Camera size={14}/>} label="Caméras" />
            <MiniProof icon={<Users size={14}/>} label="Équipes" />
            <MiniProof icon={<LockKeyhole size={14}/>} label="Audit" />
          </div>
        </div>
      </section>
    </main>
  );
}

function HealthPill({label,ok}:{label:string;ok?:boolean}) {
  return <span className={ok ? "health-pill" : "health-pill off"}>{ok === undefined ? "…" : ok ? "● " : "○ "}{label}</span>;
}

function MiniProof({icon,label}:{icon:React.ReactNode;label:string}) {
  return <div className="proof" style={{padding:"10px",textAlign:"center"}}><div style={{display:"flex",justifyContent:"center",color:"var(--accent)"}}>{icon}</div><span>{label}</span></div>;
}
