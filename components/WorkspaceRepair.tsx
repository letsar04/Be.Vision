"use client";

import { useState } from "react";
import { RefreshCw, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

export function WorkspaceRepair() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function repair() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/bootstrap", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Impossible de terminer la configuration.");
      setMessage("Espace restauré. Actualisation…");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de configuration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{maxWidth:680}}>
      <div className="feature-icon"><Wrench size={18}/></div>
      <h2 style={{margin:"14px 0 7px"}}>Finaliser l’espace entreprise</h2>
      <p className="muted">Votre authentification est valide, mais aucun rattachement d’espace n’a été trouvé. Be.Vision peut réparer automatiquement la configuration créée pour ce compte.</p>
      <button className="btn btn-primary" onClick={repair} disabled={loading}>
        <RefreshCw size={15} className={loading ? "spin" : ""}/>
        {loading ? "Réparation…" : "Réparer maintenant"}
      </button>
      {message && <p className="muted" style={{marginTop:10}}>{message}</p>}
      <style jsx>{`.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
