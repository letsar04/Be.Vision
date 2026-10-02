import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { ensureWorkspace } from "../../../lib/workspace-provision";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ error: "Session utilisateur introuvable." }, { status: 401 });
    }

    const workspace = await ensureWorkspace(supabase, data.user);

    return NextResponse.json(
      { ok: true, ...workspace },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[api/bootstrap] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de préparer l’espace entreprise." },
      { status: 500 }
    );
  }
}
