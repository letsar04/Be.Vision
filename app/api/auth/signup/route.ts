import { NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const companyName = String(body.company_name || "").trim() || "Mon entreprise";
    const siteName = String(body.site_name || "").trim() || "Siège";

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe obligatoires." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères." }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName,
          site_name: siteName,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      session: Boolean(data.session),
      requiresEmailConfirmation: !data.session,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de créer le compte." },
      { status: 500 }
    );
  }
}
