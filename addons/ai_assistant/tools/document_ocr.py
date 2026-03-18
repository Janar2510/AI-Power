"""Phase 222: AI document processing (OCR) for vendor bills."""

import base64
import json
from typing import Any, Dict, List, Optional

from .registry import _register


def _extract_from_image_b64(env, b64_data: str) -> Optional[Dict[str, Any]]:
    """Use LLM vision to extract structured data from base64 image."""
    try:
        from ..llm import _get_api_key
        from ..controllers.ai_controller import _get_llm_config
        key = _get_api_key(env)
        if not key:
            return None
        cfg = _get_llm_config(env)
        model_name = cfg.get("llm_model", "gpt-4o-mini")
        from openai import OpenAI
        client = OpenAI(api_key=key)
        prompt = """Extract invoice/bill data from this image. Return ONLY a JSON object with these keys (use null for missing):
- vendor: string (vendor/supplier name)
- invoice_number: string
- date: string (YYYY-MM-DD)
- currency: string (e.g. EUR, USD)
- total: number
- lines: array of {description: string, quantity: number, price: number, amount: number}
Return only the JSON, no other text."""
        resp = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_data}"}},
                    ],
                }
            ],
        )
        content = (resp.choices[0].message.content or "").strip()
        if not content:
            return None
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


@_register("process_document", "Extract vendor bill data from image/PDF using LLM vision. Phase 222.")
def process_document(
    env,
    attachment_id: int,
    create_bill: bool = False,
) -> Dict[str, Any]:
    """
    Read ir.attachment, send to LLM vision, return extracted data.
    If create_bill=True, create draft account.move (in_invoice) with extracted data.
    """
    try:
        Attachment = env["ir.attachment"]
        Move = env.get("account.move")
        MoveLine = env.get("account.move.line")
        Journal = env.get("account.journal")
        Account = env.get("account.account")
    except KeyError:
        return {"data": None, "move_id": None, "error": "ir.attachment not available"}
    recs = Attachment.search_read([("id", "=", attachment_id)], ["datas", "mimetype", "name"])
    if not recs:
        return {"data": None, "move_id": None, "error": "Attachment not found"}
    r = recs[0]
    datas = r.get("datas")
    if not datas:
        return {"data": None, "move_id": None, "error": "Attachment has no data"}
    if isinstance(datas, str):
        b64_data = datas
    else:
        b64_data = base64.b64encode(datas).decode("utf-8") if datas else ""
    if not b64_data:
        return {"data": None, "move_id": None, "error": "Empty attachment"}
    data = _extract_from_image_b64(env, b64_data)
    if not data:
        return {"data": None, "move_id": None, "error": "Could not extract data from image"}
    move_id = None
    if create_bill and data and Move and Journal and Account:
        try:
            purchase_journal = Journal.search([("type", "=", "purchase")], limit=1)
            if not purchase_journal.ids:
                purchase_journal = Journal.search([], limit=1)
            if not purchase_journal.ids:
                return {"data": data, "move_id": None, "error": "No journal for vendor bill"}
            pay_account = Account.search([("account_type", "=", "liability_payable")], limit=1)
            expense_account = Account.search([("account_type", "=", "expense")], limit=1)
            if not expense_account.ids:
                expense_account = Account.search([], limit=1)
            if not pay_account.ids or not expense_account.ids:
                return {"data": data, "move_id": None, "error": "Missing accounts"}
            Partner = env.get("res.partner")
            vendor = data.get("vendor") or "Unknown Vendor"
            partner_id = None
            if Partner and vendor:
                existing = Partner.search([("name", "ilike", vendor[:50])], limit=1)
                if existing.ids:
                    partner_id = existing.ids[0]
            move_vals = {
                "journal_id": purchase_journal.ids[0],
                "partner_id": partner_id,
                "move_type": "in_invoice",
                "invoice_origin": data.get("invoice_number") or "",
                "state": "draft",
                "date": data.get("date") or "",
            }
            move = Move.create(move_vals)
            move_id = move.ids[0] if move.ids else move.id
            total = 0.0
            lines = data.get("lines") or []
            for ln in lines:
                amt = float(ln.get("amount") or ln.get("quantity", 1) * ln.get("price", 0))
                if amt > 0:
                    MoveLine.create({
                        "move_id": move_id,
                        "account_id": expense_account.ids[0],
                        "name": ln.get("description") or "Line",
                        "debit": amt,
                        "credit": 0,
                        "partner_id": partner_id,
                    })
                    total += amt
            if total <= 0:
                total = float(data.get("total") or 0)
            if total > 0:
                MoveLine.create({
                    "move_id": move_id,
                    "account_id": pay_account.ids[0],
                    "name": "Payable",
                    "debit": 0,
                    "credit": total,
                    "partner_id": partner_id,
                })
        except Exception as e:
            return {"data": data, "move_id": move_id, "error": str(e)}
    return {"data": data, "move_id": move_id, "error": None}
