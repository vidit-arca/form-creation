"""
Lightweight Non-Blocking Audit Event Emitter Client for Halo Form Engine.
Emits events to logs-service (:8004) under the 21 CFR Part 11 audit trail schema.
"""

import os
import asyncio
import logging
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("halo_backend.audit_client")

# Resolution: Check environment or default to container/localhost URL
LOGS_SERVICE_URL = os.getenv(
    "LOGS_SERVICE_URL",
    "http://logs-service:8004" if os.path.exists("/.dockerenv") else "http://localhost:8004"
).rstrip("/")


async def emit_audit_event(
    action: str,
    category: str,
    service_origin: str = "form-engine",
    severity: str = "INFO",
    status: str = "SUCCESS",
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    entity_name: Optional[str] = None,
    before_state: Optional[Any] = None,
    after_state: Optional[Any] = None,
    state_diff: Optional[Any] = None,
    failure_reason: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    site_code: Optional[str] = None,
    station_id: Optional[str] = None,
    auth_token: Optional[str] = None,
) -> bool:
    """
    Sends an audit event payload to logs-service asynchronously.
    Resilient with a 4.0s timeout: errors are logged and never bubble up to break caller flows.
    """
    endpoint = f"{LOGS_SERVICE_URL}/audit/events"
    payload = {
        "action": action,
        "category": category,
        "service_origin": service_origin,
        "severity": severity,
        "status": status,
        "actor_id": actor_id or "system-admin",
        "actor_name": actor_name or "Console Administrator",
        "actor_email": actor_email or "admin@arcaai.com",
        "actor_role": actor_role or "Admin",
        "entity_type": entity_type,
        "entity_id": str(entity_id) if entity_id is not None else None,
        "entity_name": entity_name,
        "before_state": before_state,
        "after_state": after_state,
        "state_diff": state_diff,
        "failure_reason": failure_reason,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "site_code": site_code,
        "station_id": station_id,
    }

    headers = {"Content-Type": "application/json"}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(4.0, connect=2.0)) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code in (200, 201):
                logger.debug("✅ Audit event logged: %s (%s)", action, category)
                return True
            else:
                logger.warning(
                    "⚠️ Audit event rejected [%d]: %s -> %s",
                    resp.status_code,
                    endpoint,
                    resp.text[:200],
                )
                return False
    except Exception as exc:
        logger.warning("⚠️ Failed to transmit audit event (%s) to %s: %s", action, endpoint, exc)
        return False


def emit_audit_event_background(
    action: str,
    category: str,
    service_origin: str = "form-engine",
    severity: str = "INFO",
    status: str = "SUCCESS",
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    entity_name: Optional[str] = None,
    before_state: Optional[Any] = None,
    after_state: Optional[Any] = None,
    state_diff: Optional[Any] = None,
    failure_reason: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    site_code: Optional[str] = None,
    station_id: Optional[str] = None,
    auth_token: Optional[str] = None,
):
    """
    Schedules emit_audit_event on the running event loop without awaiting it.
    Zero-delay non-blocking emission.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            emit_audit_event(
                action=action,
                category=category,
                service_origin=service_origin,
                severity=severity,
                status=status,
                actor_id=actor_id,
                actor_name=actor_name,
                actor_email=actor_email,
                actor_role=actor_role,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_name=entity_name,
                before_state=before_state,
                after_state=after_state,
                state_diff=state_diff,
                failure_reason=failure_reason,
                ip_address=ip_address,
                user_agent=user_agent,
                site_code=site_code,
                station_id=station_id,
                auth_token=auth_token,
            )
        )
    except RuntimeError:
        # Fallback if called outside an active event loop
        asyncio.run(
            emit_audit_event(
                action=action,
                category=category,
                service_origin=service_origin,
                severity=severity,
                status=status,
                actor_id=actor_id,
                actor_name=actor_name,
                actor_email=actor_email,
                actor_role=actor_role,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_name=entity_name,
                before_state=before_state,
                after_state=after_state,
                state_diff=state_diff,
                failure_reason=failure_reason,
                ip_address=ip_address,
                user_agent=user_agent,
                site_code=site_code,
                station_id=station_id,
                auth_token=auth_token,
            )
        )

