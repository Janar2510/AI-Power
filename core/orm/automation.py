"""Base automation runner - triggers on create/write/unlink (Phase 119)."""

import json
import logging
from typing import Any, Dict, List, Optional

_logger = logging.getLogger("erp.automation")


def _parse_domain(domain_str: Optional[str]) -> List:
    """Parse domain from JSON string."""
    if not domain_str or not domain_str.strip():
        return []
    try:
        parsed = json.loads(domain_str.strip())
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def _domain_matches(env: Any, model_name: str, record_ids: List[int], domain: List) -> List[int]:
    """Return record ids that match domain. Empty domain = all match."""
    if not domain:
        return list(record_ids)
    Model = env.get(model_name)
    if not Model:
        return []
    try:
        # Search with domain + id in record_ids
        full_domain = domain + [("id", "in", record_ids)]
        recs = Model.search(full_domain)
        return recs.ids if hasattr(recs, "ids") else [r for r in recs]
    except Exception:
        return []


_automation_running = False  # Guard against recursion
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


def _run_automation_impl(env, trigger, model_name, record_ids, vals):
    Automation = env.get("base.automation")
    ServerAction = env.get("ir.actions.server")
    if not Automation or not ServerAction:
        return
    try:
        rules = Automation.search([
            ("model_name", "=", model_name),
            ("trigger", "=", trigger),
            ("active", "=", True),
        ])
        if not rules or not rules.ids:
            return
        for rule in rules:
            domain = _parse_domain(rule.read(["filter_domain"])[0].get("filter_domain"))
            matching_ids = _domain_matches(env, model_name, record_ids, domain)
            if not matching_ids:
                continue
            raw = rule.read(["action_server_id"])[0].get("action_server_id")
            action_id = raw[0] if isinstance(raw, (list, tuple)) and raw else raw
            if not action_id:
                continue
            action = ServerAction.browse(action_id)
            records = env.get(model_name).browse(matching_ids)
            try:
                action.run(records)
            except Exception as e:
                _logger.warning("Server action run failed: %s", e)
    except Exception as e:
        _logger.warning("base.automation run failed: %s", e)
