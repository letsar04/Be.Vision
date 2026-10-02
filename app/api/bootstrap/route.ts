import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase-admin";
import { getApiContext } from "../../../lib/api-auth";
import { writeAudit } from "../../../lib/audit";

export async function POST() {
  const auth = await getApiContext();
  if (!auth.ok) {
    if (auth.status === 409) {
      return repair();
    }
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ ok: true, tenant_id: auth.context.tenant!.id });
}

async function repair() {
  const context = await (await import("../../../lib/workspace")).getWorkspaceContext();
  if (!context) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!context.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const db = createAdminClient();
  const { data: tenant } = await db.from("tenants").select("id,name").eq("created_by", context.user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Aucun espace à restaurer pour ce compte." }, { status: 404 });

  await db.from("tenant_members").upsert({tenant_id:tenant.id,user_id:context.user.id,role:"owner"},{onConflict:"tenant_id,user_id"});
  const { count } = await db.from("sites").select("id",{count:"exact",head:true}).eq("tenant_id",tenant.id);
  if (!count) await db.from("sites").insert({tenant_id:tenant.id,name:"Siège"});
  await writeAudit(db,{tenantId:tenant.id,actorUserId:context.user.id,action:"workspace.repaired",resourceType:"tenant",resourceId:tenant.id});
  return NextResponse.json({ ok:true, tenant_id:tenant.id });
}
