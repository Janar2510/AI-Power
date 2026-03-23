"""Sale order (Phase 112)."""

from core.orm import Model, Recordset, api, fields


class SaleOrder(Model):
    _name = "sale.order"
    _description = "Sales Order"
    _audit = True  # Phase 205

    name = fields.Char(string="Order Reference", required=True, default="New")

    @classmethod
    def _create_sale_order_record(cls, vals):
        """Insert sale order row after name/currency defaults (Phase 478: chain from _inherit without broken super())."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if vals.get("name") == "New" or not vals.get("name"):
            IrSequence = env.get("ir.sequence") if env else None
            next_val = IrSequence.next_by_code("sale.order") if IrSequence else None
            if isinstance(next_val, str):
                vals = dict(vals, name=next_val)
            elif next_val is not None:
                vals = dict(vals, name=f"SO/{next_val:05d}")
            else:
                vals = dict(vals, name="New")
        if env and ("currency_id" not in vals or not vals.get("currency_id")):
            Company = env.get("res.company")
            if Company:
                companies = Company.search([], limit=1)
                if companies.ids:
                    cdata = Company.browse(companies.ids[0]).read(["currency_id"])[0]
                    cid = cdata.get("currency_id")
                    if isinstance(cid, (list, tuple)) and cid:
                        cid = cid[0]
                    if cid:
                        vals = dict(vals, currency_id=cid)
        return super().create(vals)

    @classmethod
    def create(cls, vals):
        return cls._create_sale_order_record(vals)
    partner_id = fields.Many2one("res.partner", string="Customer", required=True, tracking=True)
    date_order = fields.Datetime(string="Order Date", default=lambda: __import__("datetime").datetime.utcnow().isoformat())
    state = fields.Selection(
        selection=[
            ("draft", "Quotation"),
            ("sale", "Sales Order"),
            ("cancel", "Cancelled"),
        ],
        string="Status",
        default="draft",
        tracking=True,
    )
    currency_id = fields.Many2one("res.currency", string="Currency")  # Defaults from company (Phase 154)
    pricelist_id = fields.Many2one("product.pricelist", string="Pricelist")  # Phase 187
    amount_total = fields.Computed(compute="_compute_amount_total", string="Total")
    order_line = fields.One2many(
        "sale.order.line",
        "order_id",
        string="Order Lines",
    )

    def _default_date_order(self):
        from datetime import datetime
        return datetime.utcnow().isoformat()

    @classmethod
    def _onchange_partner_id(cls, vals):
        """Fill currency_id from company when partner changes (Phase 165)."""
        env = getattr(cls._registry, "_env", None) if cls._registry else None
        if not env or vals.get("currency_id"):
            return {}
        Company = env.get("res.company")
        if not Company:
            return {}
        try:
            companies = Company.search([], limit=1)
            if not companies or not companies.ids:
                return {}
            cdata = Company.browse(companies.ids[0]).read(["currency_id"])[0]
            cid = cdata.get("currency_id")
            if isinstance(cid, (list, tuple)) and cid:
                cid = cid[0]
            if cid:
                return {"currency_id": cid}
        except Exception:
            pass
        return {}

    @api.depends("order_line.product_uom_qty", "order_line.price_unit")
    def _compute_amount_total(self):
        if not self:
            return []
        result = []
        for rec in self:
            lines = rec.order_line
            if not lines:
                result.append(0.0)
                continue
            rows = lines.read(["price_subtotal"])
            total = sum(r.get("price_subtotal", 0) for r in rows)
            result.append(total)
        return result

    def action_confirm(self):
        """Confirm the order (draft -> sale). Applies pricelist (Phase 187), sends confirmation email (Phase 143)."""
        self._action_confirm_sale_core()

    def _action_confirm_sale_core(self):
        """Core sale confirmation side effects shared by downstream extensions."""
        if not self:
            return True
        draft_ids = []
        for rec in self:
            rows = rec.read(["state"])
            if rows and rows[0].get("state") == "draft":
                draft_ids.append(rec.ids[0])
        if not draft_ids:
            return True
        _env = getattr(self, "env", None) or getattr(self, "_env", None)
        todo = Recordset(self._model, draft_ids, _env=_env)
        todo._apply_pricelist()
        todo.write({"state": "sale"})
        todo._send_order_confirmation_email()
        return True

    def _apply_pricelist(self):
        """Apply pricelist to order lines (Phase 187)."""
        env = getattr(self, "env", None) or (getattr(self._model._registry, "_env", None) if getattr(self._model, "_registry", None) else None)
        if not env:
            return
        Pricelist = env.get("product.pricelist")
        Line = env.get("sale.order.line")
        if not Pricelist or not Line:
            return
        ids = self.ids if hasattr(self, "ids") and self.ids else (getattr(self, "_ids", None) or [])
        if not ids and hasattr(self, "id") and self.id:
            ids = [self.id]
        for oid in ids:
            order = self._model.browse(oid)
            pricelist_id = None
            pl_val = order.read(["pricelist_id"])[0].get("pricelist_id") if order.read(["pricelist_id"]) else None
            if isinstance(pl_val, (list, tuple)) and pl_val:
                pricelist_id = pl_val[0]
            elif isinstance(pl_val, int):
                pricelist_id = pl_val
            if not pricelist_id:
                continue
            pricelist = Pricelist.browse(pricelist_id)
            rows = Line.search_read([("order_id", "=", oid)], ["id", "product_id", "product_uom_qty"])
            if not rows:
                continue
            for row in rows:
                pid = row.get("product_id")
                if isinstance(pid, (list, tuple)) and pid:
                    pid = pid[0]
                if not pid:
                    continue
                qty = float(row.get("product_uom_qty") or 0)
                price = pricelist.get_product_price(pid, qty)
                lid = row.get("id")
                if lid:
                    Line.browse(lid).write({"price_unit": price})

    def _send_order_confirmation_email(self):
        """Create mail.mail for order confirmation. Queued for cron to send."""
        if not self or not self.ids:
            return
        env = getattr(self, "env", None)
        if not env:
            return
        MailMail = env.get("mail.mail")
        Partner = env.get("res.partner")
        if not MailMail or not Partner:
            return
        for rec in self:
            rows = rec.read(["partner_id", "name", "amount_total", "order_line"])
            if not rows:
                continue
            r = rows[0]
            partner_id = r.get("partner_id")
            if not partner_id:
                continue
            # Handle Many2one from read: can be (id, name) or raw id
            if isinstance(partner_id, (list, tuple)) and partner_id:
                pid = partner_id[0]
            else:
                pid = partner_id
            partners = Partner.read_ids([pid], ["name", "email"])
            if not partners or not partners[0].get("email"):
                continue
            email_to = str(partners[0]["email"]).strip()
            order_name = r.get("name") or f"Order #{rec.id}"
            amount = r.get("amount_total") or 0
            line_count = len(r.get("order_line") or [])
            body = f"""<p>Thank you for your order.</p>
<p><strong>Order:</strong> {order_name}</p>
<p><strong>Total:</strong> {amount:,.2f}</p>
<p><strong>Items:</strong> {line_count}</p>
<p>We will process your order shortly.</p>"""
            MailMail.create({
                "email_from": "noreply@localhost",
                "email_to": email_to,
                "subject": f"Order confirmation: {order_name}",
                "body_html": body,
                "state": "outgoing",
                "res_model": "sale.order",
                "res_id": rec.id,
            })

    def action_cancel(self):
        """Cancel the order."""
        self.write({"state": "cancel"})
