import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

async function loadWorkspace(supabase: any, userId: string) {
  const membership = await supabase
    .from("tenant_members")
    .select("tenant_id,role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership.error) throw membership.error;
  if (!membership.data) {
    throw Object.assign(new Error("Aucun espace entreprise n’est associé à ce compte."), { code: "WORKSPACE_NOT_FOUND" });
  }

  const tenant = await supabase
    .from("tenants")
    .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
    .eq("id", membership.data.tenant_id)
    .single();

  if (tenant.error) throw tenant.error;

  const site = await supabase
    .from("sites")
    .select("id,name,address,timezone,status,created_at")
    .eq("tenant_id", tenant.data.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (site.error) throw site.error;

  return { tenant: tenant.data, membership: membership.data, site: site.data };
}

function errorResponse(error: unknown, fallback: string, status = 500) {
  const value = error as { message?: string; code?: string; details?: string; hint?: string } | null;
  return NextResponse.json(
    {
      error: value?.message || fallback,
      code: value?.code,
      details: value?.details,
      hint: value?.hint
    },
    { status, headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const auth = await supabase.auth.getUser();

    if (auth.error || !auth.data.user) {
      return errorResponse(auth.error, "Session utilisateur introuvable.", 401);
    }

    const workspace = await loadWorkspace(supabase, auth.data.user.id);
    return NextResponse.json(
      { tenant: workspace.tenant, site: workspace.site },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[api/workspace] GET failed", error);
    return errorResponse(error, "Impossible de charger l’espace.");
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createServerClient();
    const auth = await supabase.auth.getUser();

    if (auth.error || !auth.data.user) {
      return errorResponse(auth.error, "Session utilisateur introuvable.", 401);
    }

    const workspace = await loadWorkspace(supabase, auth.data.user.id);
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
      return errorResponse(
        new Error("Complétez les champs obligatoires : " + missing.join(", ") + "."),
        "Champs obligatoires manquants.",
        422
      );
    }

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
        setup_completed: true
      })
      .eq("id", workspace.tenant.id)
      .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
      .single();

    if (tenantUpdate.error) {
      console.error("[api/workspace] tenant update failed", tenantUpdate.error);
      return errorResponse(tenantUpdate.error, "Impossible d’enregistrer les informations de l’entreprise.", 400);
    }

    let site = workspace.site;

    if (!site) {
      const siteInsert = await supabase
        .from("sites")
        .insert({
          tenant_id: workspace.tenant.id,
          name: siteName,
          address: String(body.site_address || "").trim() || null,
          timezone,
          status: "active"
        })
        .select("id,name,address,timezone,status")
        .single();

      if (siteInsert.error) {
        console.error("[api/workspace] site insert failed", siteInsert.error);
        return errorResponse(siteInsert.error, "Impossible de créer le site principal.", 400);
      }
      site = siteInsert.data;
    } else {
      const siteUpdate = await supabase
        .from("sites")
        .update({
          name: siteName,
          address: String(body.site_address || "").trim() || null,
          timezone,
          status: "active"
        })
        .eq("id", site.id)
        .eq("tenant_id", workspace.tenant.id)
        .select("id,name,address,timezone,status")
        .single();

      if (siteUpdate.error) {
        console.error("[api/workspace] site update failed", siteUpdate.error);
        return errorResponse(siteUpdate.error, "Impossible d’enregistrer le site principal.", 400);
      }
      site = siteUpdate.data;
    }

    return NextResponse.json(
      { ok: true, tenant: tenantUpdate.data, site },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[api/workspace] PUT failed", error);
    return errorResponse(error, "Impossible d’enregistrer les paramètres.");
  }
}
