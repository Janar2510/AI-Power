"""Base automation runner - triggers on create/write/unlink/on_time (Phase 119, 226)."""

import json
import logging
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional

_logger = logging.getLogger("erp.automation")


def _parse_domain(domain_str: Optional[str]) -> List:
    """Parse domain from JSON string."""
    if not domain_str or not str(domain_str).strip():
        return []
    try:
        parsed = json.loads(str(domain_str).strip())
        return parsed if isinstance(parsed, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _domain_matches(env: Any, model_name: str, record_ids: List[int], domain: List) -> List[int]:
    """Return record ids that match domain. Empty domain = all match."""
    if not domain:
        return list(record_ids)
    Model = env.get(model_name)
    if not Model:
        return []
    try:
        full_domain = domain + [("id", "in", record_ids)]
        recs = Model.search(full_domain)
        return recs.ids if hasattr(recs, "ids") else [r for r in recs]
    except Exception:
        return []


_automation_running = False


def run_base_automation(
    env: Any,
    trigger: str,
    model_name: str,
    record_ids: List[int],
    vals: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Run base.automation rules for the given trigger.
    trigger: 'on_create', 'on_write', 'on_unlink', 'on_time'
    model_name: e.g. 'crm.lead'
    record_ids: affected record ids
    vals: for on_write, the written values
    """
    if not record_ids:
        return
    global _automation_running
    if _automation_running:
        return
    _automation_running = True
    try:
        _run_automation_impl(env, trigger, model_name, record_ids, vals)
    finally:
        _automation_running = False


def _execute_automation_rule(
    env: Any,
    rule_row: Dict[str, Any],
    model_name: str,
    record_ids: List[int],
    vals: Optional[Dict[str, Any]],
    trigger: str = "on_write",
) -> None:
    """Execute a single automation rule's action on given record_ids."""
    from core.orm.models import Recordset
    Model = env.registry.get(model_name) if hasattr(env, "registry") else None
    if not Model:
        return
    ServerAction = env.get("ir.actions.server")
    action_type = rule_row.get("action_type") or "server_action"
    records = Recordset(Model, record_ids, _env=env)
    if action_type == "update":
        raw = rule_row.get("update_vals")
        if isinstance(raw, dict):
            update_vals = raw
        else:
            update_vals_str = (raw or "{}") if raw is not None else "{}"
            if isinstance(update_vals_str, bytes):
                update_vals_str = update_vals_str.decode("utf-8", errors="replace")
            update_vals_str = str(update_vals_str).strip()
            try:
                update_vals = json.loads(update_vals_str) if update_vals_str else {}
            except (json.JSONDecodeError, TypeError):
                _logger.warning("base.automation update_vals invalid JSON: %s", str(raw)[:100])
                update_vals = {}
        if update_vals and isinstance(update_vals, dict):
            records.write(update_vals)
    elif action_type == "webhook":
        url = rule_row.get("webhook_url") or ""
        if url:
            payload = {"event": trigger, "model": model_name, "ids": record_ids, "vals": vals or {}}
            payload_bytes = json.dumps(payload, default=str).encode()
            req = urllib.request.Request(url, data=payload_bytes, headers={"Content-Type": "application/json"}, method="POST")
            try:
                urllib.request.urlopen(req, timeout=10)
            except Exception as e:
                _logger.warning("base.automation webhook %s failed: %s", url[:50], e)
    elif action_type == "server_action" and ServerAction:
        raw = rule_row.get("action_server_id")
        action_id = raw[0] if isinstance(raw, (list, tuple)) and raw else raw
        if action_id:
            action = ServerAction.browse(action_id)
            if action and hasattr(action, "run"):
                action.run(records)


def _run_automation_impl(env, trigger, model_name, record_ids, vals):
    Automation = env.get("base.automation")
    if not Automation:
        _logger.debug("base.automation: Automation not loaded")
        return
    try:
        rules = Automation.search([
            ("model_name", "=", model_name),
            ("trigger", "=", trigger),
            ("active", "=", True),
        ])
        if not rules or not rules.ids:
            _logger.debug("base.automation: no rules for %s %s", model_name, trigger)
            return
        Model = env.get(model_name)
        if not Model:
            return
        for rule in rules:
            row = rule.read(["filter_domain", "action_type", "action_server_id", "update_vals", "webhook_url"])
            row = row[0] if row else {}
            domain = _parse_domain(row.get("filter_domain"))
            matching_ids = _domain_matches(env, model_name, record_ids, domain)
            if not matching_ids:
                continue
            try:
                _execute_automation_rule(env, row, model_name, matching_ids, vals, trigger)
            except Exception as e:
                _logger.warning("base.automation rule %s failed: %s", rule.id, e)
    except Exception as e:
        _logger.warning("base.automation run failed: %s", e)
