"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function WorkspaceRepair() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Préparation de votre espace entreprise…");
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const router = useRouter();

  async function bootstrap() {
    if (started.current && loading) return;
    started.current = true;
    setLoading(true);
    setFailed(false);
    setMessage("Création de l’espace entreprise…");

    try {
      const response = await fetch("/api/bootstrap", {
        method: "POST",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Impossible de préparer l’espace.");

      setMessage("Espace prêt. Ouverture du centre de contrôle…");
      await new Promise(resolve => setTimeout(resolve, 500));
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      started.current = false;
      setFailed(true);
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "La préparation de l’espace a échoué.");
    }
  }

  useEffect(() => { void bootstrap(); }, []);

  return <div className="panel onboarding-panel">
    <div className="onboarding-icon">
      {loading ? <Loader2 size={25} /> : <CheckCircle2 size={25} />}
    </div>
    <div className="eyebrow">Mise en route automatique</div>
    <h2>Préparation de votre centre de contrôle</h2>
    <p className="onboarding-copy">
      Be.Vision crée ou récupère automatiquement votre espace, votre site principal et les règles de sécurité de départ.
    </p>
    <div className="onboarding-steps">
      <Step text="Espace entreprise" />
      <Step text="Site principal" />
      <Step text="Règles de sécurité" />
      <Step text="Centre de contrôle" />
    </div>
    <div className={failed ? "auth-status" : "auth-status info"} style={{ marginTop: 16 }}>{message}</div>
    {failed && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button className="btn btn-primary" onClick={() => void bootstrap()}><RefreshCw size={15}/> Réessayer</button>
      <a className="btn btn-secondary" href="/login">Changer de compte</a>
    </div>}
    {!failed && <div className="health-strip" style={{ marginTop: 14 }}>
      <span className="health-pill"><ShieldCheck size={12}/> Session sécurisée</span>
      <span className="health-pill">Configuration automatique</span>
    </div>}
  </div>;
}

function Step({ text }: { text: string }) {
  return <div className="onboarding-step">
    <div className="onboarding-step-icon active"><Loader2 size={14} /></div>
    <span>{text}</span>
  </div>;
}
