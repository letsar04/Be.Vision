"use client";

import { useState } from "react";
import { CheckCircle2, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export function DemoEventButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function simulate() {
    setLoading(true);
    setDone(false);
    setError("");
    try {
      const response = await fetch("/api/simulate/event", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Simulation impossible.");
      setDone(true);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Simulation impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-secondary btn-small" disabled={disabled || loading} onClick={() => void simulate()}>
        {done ? <CheckCircle2 size={15} /> : <Play size={15} />}
        {loading ? "Simulation…" : done ? "Événement créé" : "Tester le flux"}
      </button>
      {error && <div style={{ fontSize: 10, color: "var(--danger)", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
