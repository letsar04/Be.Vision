import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { ensureWorkspace } from "../../../lib/workspace-provision";

export const dynamic = "force-dynamic";

async function getVerifiedUser() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { supabase, user: null, error: error?.message || "Session utilisateur introuvable." };
  }
  return { supabase, user: data.user, error: null };
}

export async function GET() {
  try {
    const auth = await getVerifiedUser();
    if (!auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });

    const workspace = await ensureWorkspace(auth.supabase, auth.user);

    return NextResponse.json(
      { tenant: workspace.tenant, site: workspace.site },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[api/workspace] GET failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible de charger l’espace.",
        code: error && typeof error === "object" && "code" in error ? String((error as any).code) : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getVerifiedUser();
    if (!auth.user) return NextResponse.json({ error: auth.error }, { status: 401 });

    const workspace = await ensureWorkspace(auth.supabase, auth.user);
    const body = await req.json();

    const name = String(body.name || "").trim();
    const country = String(body.country || "").trim() || "Burkina Faso";
    const siteName = String(body.site_name || "").trim();
    const timezone = String(body.timezone || "Africa/Ouagadougou").trim();

    const missing: string[] = [];
    if (!name) missing.push("nom de l’entreprise");
    if (!country) missing.push("pays");
    if (!siteName) missing.push("nom du site principal");
    if (!timezone) missing.push("fuseau horaire");

    if (missing.length) {
      return NextResponse.json(
        { error: "Complétez les champs obligatoires : " + missing.join(", ") + "." },
        { status: 422 }
      );
    }

    const tenantUpdate = await auth.supabase
      .from("tenants")
      .update({
        name,
        legal_name: String(body.legal_name || "").trim() || null,
        industry: String(body.industry || "").trim() || null,
        company_size: String(body.company_size || "").trim() || null,
        country,
        city: String(body.city || "").trim() || null,
        address: String(body.address || "").trim() || null,
        phone: String(body.phone || "").trim() || null,
        website: String(body.website || "").trim() || null,
        setup_completed: true
      })
      .eq("id", workspace.tenant.id)
      .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
      .single();

    if (tenantUpdate.error) {
      console.error("[api/workspace] tenant update failed", tenantUpdate.error);
      return NextResponse.json(
        { error: "Impossible d’enregistrer les informations de l’entreprise.", details: tenantUpdate.error.message, code: tenantUpdate.error.code },
        { status: 400 }
      );
    }

    const siteUpdate = await auth.supabase
      .from("sites")
      .update({
        name: siteName,
        address: String(body.site_address || "").trim() || null,
        timezone,
        status: "active"
      })
      .eq("id", workspace.site.id)
      .eq("tenant_id", workspace.tenant.id)
      .select("id,name,address,timezone,status")
      .single();

    if (siteUpdate.error) {
      console.error("[api/workspace] site update failed", siteUpdate.error);
      return NextResponse.json(
        { error: "Impossible d’enregistrer le site principal.", details: siteUpdate.error.message, code: siteUpdate.error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: true, tenant: tenantUpdate.data, site: siteUpdate.data },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[api/workspace] PUT failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible d’enregistrer les paramètres." },
      { status: 500 }
    );
  }
}
