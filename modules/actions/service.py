"""Reusable, auditable action and notification adapters."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Protocol
import json
import urllib.request

class Notifier(Protocol):
    async def send(self, payload: dict[str, Any]) -> dict[str, Any]: ...

class WebhookNotifier:
    def __init__(self, url: str, timeout: float = 5.0):
        self.url = url
        self.timeout = timeout

    async def send(self, payload: dict[str, Any]) -> dict[str, Any]:
        import asyncio
        body = json.dumps(payload).encode()
        def request():
            req = urllib.request.Request(self.url, data=body, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                return {"status_code": response.status}
        return await asyncio.to_thread(request)

class ActionService:
    def __init__(self, persistence: Any):
        self.persistence = persistence

    async def notify(self, tenant_ref: str, action_type: str, payload: dict[str, Any], event_id: str | None = None):
        return await self.persistence.create_action(tenant_ref, action_type, payload, event_id=event_id)
