"""Report rendering - Jinja2 HTML templates, optional PDF via weasyprint."""

import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from werkzeug.wrappers import Response

from core.tools import config
from core.modules.module import get_module_path
from core.sql_db import get_cursor
from core.orm import Environment
from core.http.auth import get_session_uid, get_session_db, _get_registry
from .request import Request

# Report name -> (model, template_path, fields)  Phase 183
_REPORT_REGISTRY: Dict[str, tuple] = {
    "crm.lead_summary": ("crm.lead", "crm/report/lead_summary.html", ["id", "name", "type", "stage_id", "expected_revenue", "date_deadline", "description"]),
    "sale.order": ("sale.order", "sale/report/sale_order_report.html", ["id", "name", "partner_id", "date_order", "state", "amount_total", "order_line"]),
    "account.move": ("account.move", "account/report/invoice_report.html", ["id", "name", "partner_id", "invoice_origin", "state", "line_ids"]),
    "purchase.order": ("purchase.order", "purchase/report/purchase_order_report.html", ["id", "name", "partner_id", "state", "order_line"]),
    "stock.picking": ("stock.picking", "stock/report/delivery_slip_report.html", ["id", "name", "partner_id", "origin", "state", "move_ids"]),
}


def _get_report_from_db(report_name: str, db: str, registry: Any) -> Optional[tuple]:
    """Look up report metadata from ir.actions.report (Phase 110). Returns (model, template_path, fields) or None."""
    try:
        with get_cursor(db) as cr:
            env = Environment(registry, cr=cr, uid=1)
            Report = env.get("ir.actions.report")
            if not Report:
                return None
            rows = Report.search_read([("report_name", "=", report_name)], ["model", "report_file", "fields_csv"], limit=1)
            if not rows:
                return None
            r = rows[0]
            model_name = r.get("model", "")
            report_file = r.get("report_file", "")
            if not model_name or not report_file:
                return None
            fields_csv = (r.get("fields_csv") or "").strip()
            fields = [f.strip() for f in fields_csv.split(",") if f.strip()] if fields_csv else ["id", "name"]
            return (model_name, report_file, fields)
    except Exception:
        return None


def _load_template(module: str, rel_path: str) -> Optional[str]:
    """Load template content from module path."""
    base = get_module_path(module)
    if not base:
        return None
    path = base / rel_path
    if not path.exists() or not path.is_file():
        return None
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None


def _render_report_html(report_name: str, ids: List[int], request: Request) -> Optional[Response]:
    """Render report as HTML. Returns Response or None. Uses _REPORT_REGISTRY first, then ir.actions.report (Phase 110)."""
    reg = None
    if report_name in _REPORT_REGISTRY:
        reg = _REPORT_REGISTRY[report_name]
    else:
        uid = get_session_uid(request)
        db = get_session_db(request)
        if uid is not None and db:
            registry = _get_registry(db)
            reg = _get_report_from_db(report_name, db, registry)
    if not reg:
        return None
    model_name = reg[0]
    template_rel = reg[1]
    report_fields = reg[2] if len(reg) > 2 else ["id", "name"]
    module = template_rel.split("/")[0]
    template_path = "/".join(template_rel.split("/")[1:])
    content = _load_template(module, template_path)
    if not content:
        return Response("Report template not found", status=404)

    uid = get_session_uid(request)
    db = get_session_db(request)
    if uid is None:
        return Response("Unauthorized", status=401)
    registry = _get_registry(db)
    with get_cursor(db) as cr:
        env = Environment(registry, cr=cr, uid=uid)
        registry.set_env(env)
        Model = env.get(model_name)
        if not Model:
            return Response("Model not found", status=404)
        records = Model.browse(ids).read(report_fields) if ids else []
        if not ids and not records:
            records = []
        for rec in records:
            for f in report_fields:
                val = rec.get(f)
                if not val or not isinstance(val, (list, tuple)) or not val:
                    continue
                first = val[0]
                if f == "order_line" and model_name == "sale.order":
                    Line = env.get("sale.order.line")
                    if Line and isinstance(first, int):
                        rec[f] = Line.read_ids(list(val), ["name", "product_uom_qty", "price_unit", "price_subtotal"])
                elif f == "order_line" and model_name == "purchase.order":
                    Line = env.get("purchase.order.line")
                    if Line and isinstance(first, int):
                        rec[f] = Line.read_ids(list(val), ["name", "product_qty", "price_unit"])
                elif f == "line_ids" and model_name == "account.move":
                    Line = env.get("account.move.line")
                    if Line and isinstance(first, int):
                        rec[f] = Line.read_ids(list(val), ["name", "account_id", "debit", "credit"])
                elif f == "move_ids" and model_name == "stock.picking":
                    Move = env.get("stock.move")
                    if Move and isinstance(first, int):
                        rec[f] = Move.read_ids(list(val), ["name", "product_uom_qty"])

    try:
        template_engine = (config.get_config().get("report_template_engine", "jinja2") or "jinja2").lower()
        if template_engine != "jinja2":
            template_engine = "jinja2"
        from jinja2 import Template
        template = Template(content)
        html = template.render(records=records, report_name=report_name)
        return Response(html, mimetype="text/html; charset=utf-8")
    except Exception as e:
        return Response(f"Template error: {e}", status=500)


def _render_report_pdf(report_name: str, ids: List[int], request: Request) -> Optional[Response]:
    """Render report as PDF. Falls back to HTML if weasyprint not available."""
    html_resp = _render_report_html(report_name, ids, request)
    if not html_resp or html_resp.status_code != 200:
        return html_resp
    try:
        pdf_engine = (config.get_config().get("report_pdf_engine", "weasyprint") or "weasyprint").lower()
        if pdf_engine != "weasyprint":
            pdf_engine = "weasyprint"
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_resp.get_data(as_text=True)).write_pdf()
        return Response(pdf_bytes, mimetype="application/pdf")
    except ImportError:
        return html_resp
    except Exception as e:
        return html_resp  # Fallback to HTML on PDF error


REPORT_PATH_RE = re.compile(r"^/report/(html|pdf)/([a-zA-Z0-9_.]+)/([\d,]+)$")


def handle_report(request: Request) -> Optional[Response]:
    """Handle /report/html/<name>/<ids> or /report/pdf/<name>/<ids>. Returns None if path doesn't match."""
    m = REPORT_PATH_RE.match(request.path)
    if not m:
        return None
    fmt, report_name, ids_str = m.group(1), m.group(2), m.group(3)
    ids = [int(x.strip()) for x in ids_str.split(",") if x.strip()]
    if fmt == "pdf":
        return _render_report_pdf(report_name, ids, request)
    return _render_report_html(report_name, ids, request)
