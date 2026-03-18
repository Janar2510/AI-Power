"""Phase 202: Sales revenue report."""

from typing import Any, Dict, List

from core.orm import Model


class SaleOrder(Model):
    _inherit = "sale.order"

    @classmethod
    def get_sales_revenue_report(cls, date_from: str, date_to: str, group_by: str = "month") -> List[Dict[str, Any]]:
        """
        Sales revenue: period grouping (day/week/month), product breakdown.
        group_by: 'day', 'week', 'month', or 'product'
        """
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env:
            return []
        cr = getattr(env, "cr", None)
        if not cr:
            return []
        df = date_from or "1900-01-01"
        dt = date_to or "9999-12-31"
        if group_by == "product":
            cr.execute(
                """
                SELECT COALESCE(pt.name, 'Other') as product_name,
                       COALESCE(SUM(sol.product_uom_qty * sol.price_unit), 0) as revenue,
                       COALESCE(SUM(sol.product_uom_qty), 0) as qty_sold
                FROM sale_order so
                JOIN sale_order_line sol ON sol.order_id = so.id
                LEFT JOIN product_product pp ON pp.id = sol.product_id
                LEFT JOIN product_template pt ON pt.id = pp.product_template_id
                WHERE so.state = 'sale'
                  AND so.date_order::date >= %s AND so.date_order::date <= %s
                GROUP BY pt.id, pt.name
                ORDER BY revenue DESC
                """,
                (df, dt),
            )
            rows = cr.fetchall()
            result = []
            for r in rows:
                product = r.get("product_name") if isinstance(r, dict) else (r[0] if isinstance(r, (list, tuple)) else "")
                revenue = r.get("revenue") if isinstance(r, dict) else (r[1] if isinstance(r, (list, tuple)) else 0)
                qty = r.get("qty_sold") if isinstance(r, dict) else (r[2] if isinstance(r, (list, tuple)) else 0)
                result.append({"product": product or "Other", "revenue": round(float(revenue), 2), "qty_sold": round(float(qty), 2)})
            return result
        period_expr = {
            "day": "so.date_order::date",
            "week": "date_trunc('week', so.date_order::date)::date",
            "month": "date_trunc('month', so.date_order::date)::date",
        }.get(group_by, "date_trunc('month', so.date_order::date)::date")
        cr.execute(
            f"""
            SELECT {period_expr} as period,
                   COALESCE(SUM(sol.product_uom_qty * sol.price_unit), 0) as revenue
            FROM sale_order so
            JOIN sale_order_line sol ON sol.order_id = so.id
            WHERE so.state = 'sale'
              AND so.date_order::date >= %s AND so.date_order::date <= %s
            GROUP BY 1
            ORDER BY 1
            """,
            (df, dt),
        )
        rows = cr.fetchall()
        result = []
        for r in rows:
            period = r.get("period") if isinstance(r, dict) else (r[0] if isinstance(r, (list, tuple)) else "")
            revenue = r.get("revenue") if isinstance(r, dict) else (r[1] if isinstance(r, (list, tuple)) else 0)
            result.append({"period": str(period) if period else "", "revenue": round(float(revenue), 2)})
        return result
