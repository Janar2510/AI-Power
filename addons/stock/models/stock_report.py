"""Phase 202: Stock valuation report."""

from typing import Any, Dict, List

from core.orm import Model


class ProductProduct(Model):
    _inherit = "product.product"

    @classmethod
    def get_stock_valuation_report(cls) -> List[Dict[str, Any]]:
        """Stock valuation: product, qty_available, standard_price, total value; grouped by category."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        cr = getattr(env, "cr", None)
        if not cr:
            return []
        Quant = env.get("stock.quant")
        Location = env.get("stock.location")
        if Quant and Location:
            stock_locs = Location.search([("type", "=", "internal")])
            stock_ids = stock_locs.ids if stock_locs else []
            if stock_ids:
                cr.execute(
                    """
                    SELECT pp.id, COALESCE(pt.name, '') as name, COALESCE(pp.standard_price, 0) as cost,
                           COALESCE(pt.categ_id, 0) as categ_id
                    FROM product_product pp
                    LEFT JOIN product_template pt ON pt.id = pp.product_template_id
                    """,
                )
                product_rows = cr.fetchall()
                cr.execute(
                    """
                    SELECT product_id, SUM(quantity) as qty
                    FROM stock_quant
                    WHERE location_id = ANY(%s)
                    GROUP BY product_id
                    """,
                    (list(stock_ids),),
                )
                quant_rows = cr.fetchall()
                quant_map = {}
                for r in quant_rows:
                    pid = r.get("product_id") if isinstance(r, dict) else r[0]
                    qty = r.get("qty") if isinstance(r, dict) else r[1]
                    quant_map[pid] = float(qty or 0)
                cr.execute("SELECT id, name FROM product_category")
                categ_rows = cr.fetchall()
                categ_map = {}
                for r in categ_rows:
                    cid = r.get("id") if isinstance(r, dict) else r[0]
                    cname = r.get("name") if isinstance(r, dict) else r[1]
                    categ_map[cid] = cname
                result = []
                for prow in product_rows:
                    pid = prow.get("id") if isinstance(prow, dict) else prow[0]
                    name = prow.get("name") if isinstance(prow, dict) else prow[1]
                    cost = prow.get("cost") if isinstance(prow, dict) else prow[2]
                    categ_id = prow.get("categ_id") if isinstance(prow, dict) else prow[3]
                    qty = quant_map.get(pid, 0.0)
                    categ_name = categ_map.get(categ_id, "") if categ_id else ""
                    result.append({
                        "product": name or "Product",
                        "category": categ_name,
                        "qty_available": round(qty, 2),
                        "standard_price": round(float(cost), 2),
                        "total_value": round(qty * float(cost), 2),
                    })
                result.sort(key=lambda r: (r["category"], r["product"]))
                return result
        Product = env.get("product.product")
        Template = env.get("product.template")
        Category = env.get("product.category")
        if not Product:
            return []
        products = Product.search_read([], ["id", "name", "standard_price", "product_template_id"])
        result = []
        for p in products:
            pid = p.get("id")
            name = p.get("name", "")
            cost = float(p.get("standard_price") or 0)
            tpl = p.get("product_template_id")
            categ_name = ""
            if tpl and Template:
                tid = tpl[0] if isinstance(tpl, (list, tuple)) and tpl else tpl
                if tid:
                    trows = Template.search_read([("id", "=", tid)], ["categ_id"])
                    if trows and trows[0].get("categ_id") and Category:
                        c = trows[0]["categ_id"]
                        cid = c[0] if isinstance(c, (list, tuple)) and c else c
                        if cid:
                            crows = Category.search_read([("id", "=", cid)], ["name"])
                            if crows:
                                categ_name = crows[0].get("name", "")
            rec = Product.browse(pid)
            qty = 0.0
            try:
                rows = rec.read(["qty_available"])
                if rows:
                    qty = float(rows[0].get("qty_available") or 0)
            except Exception:
                pass
            result.append({
                "product": name,
                "category": categ_name,
                "qty_available": round(qty, 2),
                "standard_price": round(cost, 2),
                "total_value": round(qty * cost, 2),
            })
        result.sort(key=lambda r: (r["category"], r["product"]))
        return result
