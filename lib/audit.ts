import type { SupabaseClient } from "@supabase/supabase-js";

export async function writeAudit(
  db: SupabaseClient,
  args: {
    tenantId: string;
    actorUserId?: string | null;
    action: string;
    resourceType?: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await db.from("audit_logs").insert({
    tenant_id: args.tenantId,
    actor_user_id: args.actorUserId || null,
    action: args.action,
    resource_type: args.resourceType || null,
    resource_id: args.resourceId || null,
    metadata: args.metadata || {},
  });
}
