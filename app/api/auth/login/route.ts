import { NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase-server";
import { ensureWorkspace } from "../../../../lib/workspace-provision";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe obligatoires." }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    let workspaceReady = true;
    try {
      await ensureWorkspace(supabase, data.user);
    } catch (workspaceError) {
      workspaceReady = false;
      console.error("[api/auth/login] workspace provisioning failed", workspaceError);
    }

    return NextResponse.json(
      { ok: true, session: Boolean(data.session), workspaceReady },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[api/auth/login] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de se connecter." },
      { status: 500 }
    );
  }
}
