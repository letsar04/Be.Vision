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
    const options: Record<string, unknown> = {
      data: {
        company_name: companyName,
        site_name: siteName
      }
    };

    const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    if (siteUrl) {
      options.emailRedirectTo = new URL("/auth/callback", siteUrl).toString();
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: options as any
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: true,
        session: Boolean(data.session),
        requiresEmailConfirmation: !data.session
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[api/auth/signup] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de créer le compte." },
      { status: 500 }
    );
  }
}
