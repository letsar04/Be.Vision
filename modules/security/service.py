"""Policy-driven site monitoring; decisions use observable signals and stored policies."""
from __future__ import annotations
from typing import Any
from modules.policies.engine import PolicyEngine

class SecurityService:
    def __init__(self, persistence: Any, policy_engine: PolicyEngine | None = None):
        self.persistence = persistence
        self.policy_engine = policy_engine or PolicyEngine()

    async def evaluate_event(self, event: dict[str, Any]) -> list[dict[str, Any]]:
        tenant_ref = str(event.get("metadata", {}).get("tenant_id", "default"))
        policies = await self.persistence.list_policies(tenant_ref)
        results = []
        for policy in policies:
            if not policy.get("enabled", True):
                continue
            evaluation = self.policy_engine.evaluate_definition(event, policy.get("definition") or {})
            saved = await self.persistence.create_policy_evaluation(
                tenant_ref, policy["id"], event.get("id"), evaluation
            )
            item = {"policy": policy, "evaluation": evaluation, "record": saved, "actions": []}
            if evaluation["matched"]:
                for action in (policy.get("definition") or {}).get("actions", []):
                    action_type = str(action.get("type", "notify"))
                    payload = dict(action.get("payload") or {})
                    payload.update({"policy_id": policy["id"], "reasons": evaluation["reasons"], "event": event})
                    created = await self.persistence.create_action(
                        tenant_ref, action_type, payload, event_id=event.get("id")
                    )
                    item["actions"].append(created)
                results.append(item)
        return results
