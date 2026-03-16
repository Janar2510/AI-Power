"""Webhook model for outbound event delivery (Phase 159)."""

from typing import Any

import hashlib
import hmac
import json
import logging
import threading
from datetime import datetime

from core.orm import Model, fields

_logger = logging.getLogger("erp.webhook")


class IrWebhook(Model):
    _name = "ir.webhook"
    _description = "Webhook"

    name = fields.Char(required=True)
    model_name = fields.Char(string="Model", required=True)
    trigger = fields.Selection(
        selection=[
            ("on_create", "On Create"),
            ("on_write", "On Write"),
            ("on_unlink", "On Unlink"),
        ],
        required=True,
    )
    url = fields.Char(string="URL", required=True)
    secret = fields.Char(string="Secret")
    active = fields.Boolean(default=True)
    headers = fields.Text(string="Headers (JSON)")

    @staticmethod
    def _compute_signature(payload: bytes, secret: str) -> str:
        """HMAC-SHA256 signature for payload."""
        if not secret:
            return ""
        return hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()


class IrWebhookLog(Model):
    _name = "ir.webhook.log"
    _description = "Webhook Log"

    webhook_id = fields.Many2one("ir.webhook", string="Webhook", ondelete="cascade")
    payload = fields.Text()
    response_code = fields.Integer(string="Response Code")
    response_body = fields.Text(string="Response Body")
    created_at = fields.Datetime(default=lambda: datetime.utcnow().isoformat())


def run_webhooks(env: Any, trigger: str, model_name: str, record_ids: list, vals: dict = None) -> None:
    """Fire webhooks for matching ir.webhook rules (Phase 159)."""
    Webhook = env.get("ir.webhook")
    if not Webhook or not record_ids:
        return
    try:
        hooks = Webhook.search([
            ("model_name", "=", model_name),
            ("trigger", "=", trigger),
            ("active", "=", True),
        ])
        if not hooks or not hooks.ids:
            return
        payload = {
            "event": trigger,
            "model": model_name,
            "ids": record_ids,
            "vals": vals or {},
            "timestamp": datetime.utcnow().isoformat(),
        }
        payload_bytes = json.dumps(payload, default=str).encode()
        for hook in hooks.browse(hooks.ids):
            _deliver_async(env, hook, payload_bytes)
    except Exception as e:
        _logger.warning("Webhook run_webhooks: %s", e)


def _deliver_async(env, hook, payload_bytes: bytes) -> None:
    """Deliver webhook in background thread."""
    def _do():
        try:
            _deliver_sync(env, hook, payload_bytes)
        except Exception as e:
            _logger.warning("Webhook delivery failed: %s", e)
    t = threading.Thread(target=_do, daemon=True)
    t.start()


def _deliver_sync(env, hook, payload_bytes: bytes) -> None:
    """Deliver webhook synchronously (called from thread)."""
    import urllib.request
    Log = env.get("ir.webhook.log")
    row = hook.read(["url", "secret", "headers"])[0] if hook.ids else {}
    url = row.get("url", "")
    secret = row.get("secret", "") or ""
    headers_json = row.get("headers", "") or "{}"
    if not url:
        return
    sig = IrWebhook._compute_signature(payload_bytes, secret)
    req_headers = {"Content-Type": "application/json"}
    if sig:
        req_headers["X-Webhook-Signature"] = f"sha256={sig}"
    try:
        parsed = json.loads(headers_json)
        if isinstance(parsed, dict):
            req_headers.update(parsed)
    except Exception:
        pass
    req = urllib.request.Request(url, data=payload_bytes, headers=req_headers, method="POST")
    code = 0
    body = ""
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.getcode()
            body = resp.read().decode()[:2000]
    except urllib.error.HTTPError as e:
        code = e.code
        try:
            body = e.read().decode()[:2000]
        except Exception:
            body = str(e)
    except Exception as e:
        body = str(e)[:2000]
    if Log:
        hook_id = hook.id if hasattr(hook, "id") else (hook.ids[0] if hook.ids else None)
        Log.create({
            "webhook_id": hook_id,
            "payload": payload_bytes.decode()[:5000],
            "response_code": code,
            "response_body": body,
        })
