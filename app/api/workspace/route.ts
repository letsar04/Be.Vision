import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { ensureWorkspace } from "../../../lib/workspace-provision";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ error: "Session utilisateur introuvable." }, { status: 401 });

    const workspace = await ensureWorkspace(supabase, data.user);
    const siteQuery = await supabase
      .from("sites")
      .select("id,name,address,timezone,status")
      .eq("tenant_id", workspace.tenant.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ tenant: workspace.tenant, site: siteQuery.data || workspace.site }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[api/workspace] GET failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible de charger l’espace." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ error: "Session utilisateur introuvable." }, { status: 401 });

    const workspace = await ensureWorkspace(supabase, data.user);
    const body = await req.json();

    const name = String(body.name || "").trim();
    const country = String(body.country || "").trim();
    const siteName = String(body.site_name || "").trim();
    const timezone = String(body.timezone || "Africa/Ouagadougou").trim();

    if (!name || !country || !siteName || !timezone) {
      return NextResponse.json({ error: "Renseignez le nom de l’entreprise, le pays, le site principal et le fuseau horaire." }, { status: 400 });
    }

    const setupCompleted = Boolean(name && country && siteName && timezone);

    const tenantUpdate = await supabase
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
        setup_completed: setupCompleted
      })
      .eq("id", workspace.tenant.id)
      .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
      .single();

    if (tenantUpdate.error) throw tenantUpdate.error;

    const siteUpdate = await supabase
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

    if (siteUpdate.error) throw siteUpdate.error;

    return NextResponse.json({ ok: true, tenant: tenantUpdate.data, site: siteUpdate.data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[api/workspace] PUT failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impossible d’enregistrer les paramètres." }, { status: 400 });
  }
}
