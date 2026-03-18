"""Phase 228: AI demand forecasting, cashflow, reorder suggestions."""

import json
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from .registry import _register


def _get_llm_summary(env, prompt: str) -> Optional[str]:
    """Get LLM summary when enabled. Returns None on failure."""
    try:
        from ..llm import _get_api_key
        from ..controllers.ai_controller import _get_llm_config
        cfg = _get_llm_config(env)
        if (cfg.get("llm_enabled") or "0") != "1":
            return None
        key = _get_api_key(env)
        if not key:
            return None
        from openai import OpenAI
        client = OpenAI(api_key=key)
        model_name = cfg.get("llm_model", "gpt-4o-mini")
        resp = client.chat.completions.create(model=model_name, messages=[{"role": "user", "content": prompt}])
        return (resp.choices[0].message.content or "").strip()
    except Exception:
        return None


@_register("forecast_demand", "Forecast product demand from sales history. Phase 228.")
def forecast_demand(
    env,
    product_id: Optional[int] = None,
    periods_ahead: int = 4,
    use_llm: bool = True,
) -> Dict[str, Any]:
    """Aggregate sale.order.line by product; predict next-period demand. Returns {product_id, product_name, history, forecast, summary}."""
    Line = env.get("sale.order.line")
    Order = env.get("sale.order")
    Product = env.get("product.product")
    if not all([Line, Order, Product]):
        return {"error": "sale.order.line or product.product not found"}
    Order = env.get("sale.order")
    sale_ids = Order.search([("state", "=", "sale")]).ids if Order else []
    domain = [("order_id", "in", sale_ids)] if sale_ids else [("id", "=", -1)]
    if product_id:
        domain.append(("product_id", "=", product_id))
    rows = Line.search_read(domain, ["product_id", "product_uom_qty"], limit=200)
    by_product: Dict[int, List[float]] = defaultdict(list)
    for r in rows:
        pid = r.get("product_id")
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        if not pid:
            continue
        qty = float(r.get("product_uom_qty") or 0)
        by_product[pid].append(qty)
    if not by_product:
        return {"error": None, "products": [], "summary": "No sales data."}
    result_products = []
    for pid, qtys in list(by_product.items())[:20]:
        total = sum(qtys)
        avg = total / len(qtys) if qtys else 0
        forecast = [avg] * periods_ahead
        pname = ""
        if Product and Product.browse(pid).ids:
            pr = Product.browse(pid).read(["name"])[0] if Product.browse(pid).read(["name"]) else {}
            pname = pr.get("name", "")
        summary = f"Product {pname or pid}: avg {avg:.1f}/order, forecast {forecast[0]:.1f} next period."
        if use_llm and qtys:
            prompt = f"Sales history (qty per order): {qtys[-10:]}. Total {len(qtys)} orders. Summarize trend in 1 sentence and suggest next-period demand (number)."
            llm = _get_llm_summary(env, prompt)
            if llm:
                summary = llm
        result_products.append({
            "product_id": pid,
            "product_name": pname,
            "history": qtys[-10:],
            "forecast": forecast,
            "summary": summary,
        })
    return {"error": None, "products": result_products, "summary": f"{len(result_products)} product(s) forecast."}


@_register("forecast_cashflow", "Forecast cash position from receivables/payables. Phase 228.")
def forecast_cashflow(
    env,
    periods_ahead: int = 4,
    use_llm: bool = True,
) -> Dict[str, Any]:
    """Aggregate account.move by receivable/payable; project future cash. Returns {receivable, payable, projected, summary}."""
    Move = env.get("account.move")
    MoveLine = env.get("account.move.line")
    Account = env.get("account.account")
    if not all([Move, MoveLine, Account]):
        return {"error": "account.move or account.move.line not found"}
    recv = Account.search([("account_type", "=", "asset_receivable")], limit=1)
    pay = Account.search([("account_type", "=", "liability_payable")], limit=1)
    if not recv.ids or not pay.ids:
        return {"error": "Receivable or payable account not found"}
    recv_id, pay_id = recv.ids[0], pay.ids[0]
    recv_lines = MoveLine.search_read([("account_id", "=", recv_id)], ["debit", "credit", "move_id"], limit=200)
    pay_lines = MoveLine.search_read([("account_id", "=", pay_id)], ["debit", "credit", "move_id"], limit=200)
    Move = env.get("account.move")
    posted_ids = set(Move.search([("state", "=", "posted")]).ids) if Move else set()

    def _mid(ln):
        m = ln.get("move_id")
        return m[0] if isinstance(m, (list, tuple)) and m else m

    recv_lines = [r for r in recv_lines if _mid(r) in posted_ids]
    pay_lines = [r for r in pay_lines if _mid(r) in posted_ids]
    recv_total = sum((r.get("debit") or 0) - (r.get("credit") or 0) for r in recv_lines)
    pay_total = sum((r.get("credit") or 0) - (r.get("debit") or 0) for r in pay_lines)
    projected = recv_total - pay_total
    summary = f"Receivables: {recv_total:.0f}, Payables: {pay_total:.0f}, Projected cash: {projected:.0f}."
    if use_llm:
        prompt = f"Receivables total {recv_total:.0f}, Payables total {pay_total:.0f}. Projected cash {projected:.0f}. Give 1-sentence cash flow insight."
        llm = _get_llm_summary(env, prompt)
        if llm:
            summary = llm
    return {
        "error": None,
        "receivable": recv_total,
        "payable": pay_total,
        "projected": projected,
        "summary": summary,
    }


@_register("suggest_reorder", "Suggest reorder quantities by comparing stock vs forecasted demand. Phase 228.")
def suggest_reorder(
    env,
    product_id: Optional[int] = None,
    safety_stock_days: int = 7,
) -> Dict[str, Any]:
    """Compare current stock vs forecasted demand; suggest reorder. Returns {suggestions, summary}."""
    Product = env.get("product.product")
    Quant = env.get("stock.quant")
    Location = env.get("stock.location")
    Line = env.get("sale.order.line")
    if not all([Product, Quant, Location]):
        return {"error": "stock.quant or product.product not found"}
    stock_locs = Location.search([("type", "=", "internal")], limit=10)
    stock_ids = stock_locs.ids if stock_locs.ids else []
    if not stock_ids:
        return {"error": None, "suggestions": [], "summary": "No stock locations."}
    domain = [("location_id", "in", stock_ids)]
    if product_id:
        domain.append(("product_id", "=", product_id))
    quants = Quant.search_read(domain, ["product_id", "quantity"])
    by_product: Dict[int, float] = defaultdict(float)
    for r in quants:
        pid = r.get("product_id")
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        if pid:
            by_product[pid] += float(r.get("quantity") or 0)
    if not by_product:
        return {"error": None, "suggestions": [], "summary": "No stock on hand."}
    Order = env.get("sale.order")
    sale_ids = Order.search([("state", "=", "sale")]).ids if Order else []
    lines = Line.search_read([("order_id", "in", sale_ids)], ["product_id", "product_uom_qty"], limit=500) if sale_ids else []
    demand_by_product: Dict[int, List[float]] = defaultdict(list)
    for r in lines:
        pid = r.get("product_id")
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        if pid:
            demand_by_product[pid].append(float(r.get("product_uom_qty") or 0))
    suggestions = []
    for pid, qty_on_hand in list(by_product.items())[:30]:
        demand = demand_by_product.get(pid, [])
        avg_daily = (sum(demand) / max(len(demand), 1)) / 30 if demand else 0
        safety = avg_daily * safety_stock_days if avg_daily else 0
        if qty_on_hand < safety and safety > 0:
            reorder_qty = max(safety - qty_on_hand, 1)
            pname = ""
            if Product.browse(pid).ids:
                pr = Product.browse(pid).read(["name"])[0] if Product.browse(pid).read(["name"]) else {}
                pname = pr.get("name", "")
            suggestions.append({
                "product_id": pid,
                "product_name": pname,
                "qty_on_hand": qty_on_hand,
                "safety_stock": safety,
                "suggested_reorder": reorder_qty,
            })
    summary = f"{len(suggestions)} product(s) below safety stock; reorder suggested."
    return {"error": None, "suggestions": suggestions[:10], "summary": summary}
