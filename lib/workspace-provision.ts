import { createAdminClient } from "./supabase-admin";

type WorkspaceUser = {
  id: string;
  user_metadata?: Record<string, unknown> | null;
};

export async function ensureWorkspace(supabase: any, user: WorkspaceUser) {
  const metadata = user.user_metadata || {};
  const companyName = String(metadata.company_name || "Mon entreprise").trim() || "Mon entreprise";
  const siteName = String(metadata.site_name || "Siège").trim() || "Siège";

  let db = supabase;
  try {
    db = createAdminClient();
  } catch {
    // Fall back to the authenticated client. RLS policies cover the owner flow.
  }

  const existing = await db
    .from("tenants")
    .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;

  let tenant = existing.data;

  if (!tenant) {
    const inserted = await db
      .from("tenants")
      .insert({
        name: companyName,
        slug: "tenant-" + user.id.replaceAll("-", ""),
        created_by: user.id,
        plan: "starter",
        billing_status: "trialing",
        setup_completed: false
      })
      .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
      .single();

    if (inserted.error) throw inserted.error;
    tenant = inserted.data;
  }

  const member = await db
    .from("tenant_members")
    .upsert(
      { tenant_id: tenant.id, user_id: user.id, role: "owner" },
      { onConflict: "tenant_id,user_id" }
    );

  if (member.error) throw member.error;

  let site = (await db
    .from("sites")
    .select("id,name,address,timezone,status,created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()).data;

  if (!site) {
    const insertedSite = await db
      .from("sites")
      .insert({
        tenant_id: tenant.id,
        name: siteName,
        timezone: "Africa/Ouagadougou",
        status: "active"
      })
      .select("id,name,address,timezone,status,created_at")
      .single();

    if (insertedSite.error) throw insertedSite.error;
    site = insertedSite.data;
  }

  const defaultPolicies = [
    { name: "Personne inconnue à l’entrée", definition: { event_type: "unknown_person", severity: "high", create_incident: true, action_type: "notify", title: "Personne inconnue détectée" } },
    { name: "Caméra hors ligne", definition: { event_type: "camera_offline", severity: "high", create_incident: true, action_type: "notify", title: "Caméra hors ligne" } },
    { name: "Zone restreinte", definition: { event_type: "restricted_zone", severity: "critical", create_incident: true, action_type: "notify", title: "Présence en zone restreinte" } },
    { name: "Identification à faible confiance", definition: { event_type: "face_recognized", max_confidence: 0.75, severity: "medium", create_incident: false, action_type: "review", title: "Identification à vérifier" } }
  ];

  try {
    const policyRows = await db.from("policies").select("name").eq("tenant_id", tenant.id);
    if (!policyRows.error) {
      const existingNames = new Set((policyRows.data || []).map((item: any) => item.name));
      const missing = defaultPolicies
        .filter(item => !existingNames.has(item.name))
        .map(item => ({
          tenant_id: tenant.id,
          name: item.name,
          enabled: true,
          definition: item.definition
        }));
      if (missing.length) await db.from("policies").insert(missing);
    }
  } catch (error) {
    console.warn("[workspace] default policy provisioning skipped", error);
  }

  return { tenant, site, role: "owner" as const };
}
