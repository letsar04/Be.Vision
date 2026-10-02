import type { SupabaseClient } from "@supabase/supabase-js";

type VisionEvent = {
  id: string;
  tenant_id: string;
  type: string;
  confidence: number | null;
  camera_id: string | null;
  subject_id: string | null;
  metadata: any;
};

function matchesRule(rule: any, event: VisionEvent) {
  const eventTypes = Array.isArray(rule.event_types)
    ? rule.event_types
    : rule.event_type
      ? [rule.event_type]
      : null;

  if (eventTypes && !eventTypes.includes(event.type)) return false;
  if (rule.min_confidence != null && (event.confidence ?? 0) < Number(rule.min_confidence)) return false;
  if (rule.max_confidence != null && event.confidence != null && event.confidence > Number(rule.max_confidence)) return false;

  const zones = Array.isArray(rule.zones) ? rule.zones : rule.zone ? [rule.zone] : null;
  if (zones && zones.length && !zones.includes(event.metadata?.zone)) return false;

  return true;
}

export async function evaluatePolicies(db: SupabaseClient, event: VisionEvent) {
  const { data: policies } = await db
    .from("policies")
    .select("id,name,definition,enabled")
    .eq("tenant_id", event.tenant_id)
    .eq("enabled", true);

  for (const policy of policies || []) {
    const definition = policy.definition || {};
    if (!matchesRule(definition, event)) continue;

    const reasons = {
      event_type: event.type,
      confidence: event.confidence,
      zone: event.metadata?.zone || null,
      rule: definition,
    };

    const { data: evaluation } = await db
      .from("policy_evaluations")
      .insert({
        tenant_id: event.tenant_id,
        policy_id: policy.id,
        event_id: event.id,
        matched: true,
        reasons,
      })
      .select("id")
      .single();

    const actionType = definition.action_type || "notify";
    await db.from("actions").insert({
      tenant_id: event.tenant_id,
      event_id: event.id,
      action_type: actionType,
      status: "pending",
      payload: {
        policy_id: policy.id,
        policy_name: policy.name,
        severity: definition.severity || "medium",
        message: definition.message || ("Règle déclenchée : " + policy.name),
      },
    });

    const severity = definition.severity || "medium";
    if (definition.create_incident !== false && ["high", "critical"].includes(severity)) {
      await db.from("incidents").insert({
        tenant_id: event.tenant_id,
        event_id: event.id,
        title: definition.title || policy.name,
        severity,
        status: "open",
        metadata: {
          policy_id: policy.id,
          evaluation_id: evaluation?.id || null,
          event_type: event.type,
        },
      });
    }
  }
}
