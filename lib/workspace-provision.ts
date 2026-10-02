type WorkspaceUser = {
  id: string;
  user_metadata?: Record<string, unknown> | null;
};

export async function ensureWorkspace(supabase: any, user: WorkspaceUser) {
  const metadata = user.user_metadata || {};
  const companyName = String(metadata.company_name || "Mon espace").trim() || "Mon espace";
  const siteName = String(metadata.site_name || "Siège social").trim() || "Siège social";

  // This flow intentionally uses the authenticated Supabase client only.
  // Workspace RLS policies authorize the signed-in owner to create/update
  // their own tenant, membership and sites.
  const existing = await supabase
    .from("tenants")
    .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) throw existing.error;

  let tenant = existing.data;

  if (!tenant) {
    const inserted = await supabase
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

    if (inserted.error) {
      // Another request may have created the tenant concurrently.
      if (inserted.error.code === "23505") {
        const retry = await supabase
          .from("tenants")
          .select("id,name,plan,billing_status,trial_ends_at,stripe_customer_id,setup_completed,legal_name,industry,company_size,country,city,address,phone,website")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (retry.error || !retry.data) throw retry.error || new Error("Impossible de retrouver l’espace créé.");
        tenant = retry.data;
      } else {
        throw inserted.error;
      }
    } else {
      tenant = inserted.data;
    }
  }

  const membershipRead = await supabase
    .from("tenant_members")
    .select("tenant_id,role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipRead.error) throw membershipRead.error;

  if (!membershipRead.data) {
    const membershipInsert = await supabase
      .from("tenant_members")
      .insert({ tenant_id: tenant.id, user_id: user.id, role: "owner" })
      .select("tenant_id,role")
      .single();

    if (membershipInsert.error && membershipInsert.error.code !== "23505") {
      throw membershipInsert.error;
    }
  }

  const siteRead = await supabase
    .from("sites")
    .select("id,name,address,timezone,status,created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (siteRead.error) throw siteRead.error;

  let site = siteRead.data;

  if (!site) {
    const siteInsert = await supabase
      .from("sites")
      .insert({
        tenant_id: tenant.id,
        name: siteName,
        timezone: "Africa/Ouagadougou",
        status: "active"
      })
      .select("id,name,address,timezone,status,created_at")
      .single();

    if (siteInsert.error) {
      if (siteInsert.error.code === "23505") {
        const retrySite = await supabase
          .from("sites")
          .select("id,name,address,timezone,status,created_at")
          .eq("tenant_id", tenant.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (retrySite.error || !retrySite.data) throw retrySite.error || new Error("Impossible de retrouver le site principal.");
        site = retrySite.data;
      } else {
        throw siteInsert.error;
      }
    } else {
      site = siteInsert.data;
    }
  }

  return { tenant, site, role: "owner" as const };
}
