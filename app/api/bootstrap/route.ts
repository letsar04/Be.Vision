import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/supabase-server";
import { createAdminClient } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

const defaultPolicies = [
  { name: "Personne inconnue à l’entrée", definition: { event_type: "unknown_person", severity: "high", create_incident: true, action_type: "notify", title: "Personne inconnue détectée" } },
  { name: "Caméra hors ligne", definition: { event_type: "camera_offline", severity: "high", create_incident: true, action_type: "notify", title: "Caméra hors ligne" } },
  { name: "Zone restreinte", definition: { event_type: "restricted_zone", severity: "critical", create_incident: true, action_type: "notify", title: "Présence en zone restreinte" } },
  { name: "Identification à faible confiance", definition: { event_type: "face_recognized", max_confidence: 0.75, severity: "medium", create_incident: false, action_type: "review", title: "Identification à vérifier" } }
];

export async function POST() {
  const supabase = await createServerClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) return NextResponse.json({ error: "Session utilisateur introuvable." }, { status: 401 });

  const user = data.user;
  const meta = user.user_metadata || {};
  const companyName = String(meta.company_name || "Mon entreprise").trim() || "Mon entreprise";
  const siteName = String(meta.site_name || "Siège").trim() || "Siège";

  let db: any = supabase;
  try { db = createAdminClient(); } catch {}

  try {
    let tenant: any = null;
    const q = await db
      .from("tenants")
      .select("id,name,plan,billing_status,trial_ends_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!q.error) tenant = q.data;

    if (!tenant) {
      const inserted = await db
        .from("tenants")
        .insert({
          name: companyName,
          slug: "tenant-" + user.id.replaceAll("-", ""),
          created_by: user.id,
          plan: "starter",
          billing_status: "trialing"
        })
        .select("id,name,plan,billing_status,trial_ends_at")
        .single();

      if (inserted.error) throw inserted.error;
      tenant = inserted.data;
    }

    const member = await db
      .from("tenant_members")
      .upsert({ tenant_id: tenant.id, user_id: user.id, role: "owner" }, { onConflict: "tenant_id,user_id" })
      .select("tenant_id,role")
      .single();

    if (member.error) throw member.error;

    let site = (await db
      .from("sites")
      .select("id,name,status")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()).data;

    if (!site) {
      const insertedSite = await db
        .from("sites")
        .insert({ tenant_id: tenant.id, name: siteName, timezone: "Africa/Ouagadougou", status: "active" })
        .select("id,name,status")
        .single();

      if (insertedSite.error) throw insertedSite.error;
      site = insertedSite.data;
    }

    const existingPolicies = await db.from("policies").select("name").eq("tenant_id", tenant.id);
    if (!existingPolicies.error) {
      const names = new Set((existingPolicies.data || []).map((p: any) => p.name));
      const missing = defaultPolicies.filter(p => !names.has(p.name)).map(p => ({
        tenant_id: tenant.id,
        name: p.name,
        enabled: true,
        definition: p.definition
      }));
      if (missing.length) {
        const insertedPolicies = await db.from("policies").insert(missing);
        if (insertedPolicies.error) throw insertedPolicies.error;
      }
    }

    return NextResponse.json(
      { ok: true, tenant, site, role: "owner" },
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
