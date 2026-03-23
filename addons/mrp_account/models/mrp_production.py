from core.orm import Model, api, fields


class MrpProduction(Model):
    _inherit = "mrp.production"

    accounting_state = fields.Selection(
        [("draft", "Draft"), ("posted", "Posted")],
        string="Accounting State",
        default="draft",
    )
    cost_draft_move_id = fields.Many2one(
        "account.move",
        string="Manufacturing cost draft",
        copy=False,
        ondelete="set null",
        help="Draft journal entry stub for material cost at MO completion (Phase 531).",
    )
    cost_estimate = fields.Computed(
        compute="_compute_cost_estimate",
        store=False,
        string="Estimated material cost",
        help="BOM component qty × product standard cost (Phase 526 heuristic).",
    )

    @api.depends("bom_id", "product_qty")
    def _compute_cost_estimate(self):
        if not self:
            return []
        env = getattr(self, "env", None)
        Product = env.get("product.product") if env else None
        BomLine = env.get("mrp.bom.line") if env else None
        out = []
        for rec in self:
            total = 0.0
            row = rec.read(["bom_id", "product_qty"])[0]
            bom_ref = row.get("bom_id")
            bom_id = bom_ref[0] if isinstance(bom_ref, (list, tuple)) and bom_ref else bom_ref
            pq = float(row.get("product_qty") or 1.0)
            if bom_id and BomLine:
                bd = BomLine.search([("bom_id", "=", bom_id)])
                for line in bd:
                    lv = line.read(["product_id", "product_qty"])[0]
                    pid = lv.get("product_id")
                    if isinstance(pid, (list, tuple)) and pid:
                        pid = pid[0]
                    if not pid or not Product:
                        continue
                    lq = float(lv.get("product_qty") or 0) * pq
                    pr = Product.browse(pid).read(["product_template_id"])[0]
                    tid = pr.get("product_template_id")
                    if isinstance(tid, (list, tuple)) and tid:
                        tid = tid[0]
                    if tid:
                        Template = env.get("product.template")
                        if Template:
                            tr = Template.browse(tid).read(["standard_price"])[0]
                            total += lq * float(tr.get("standard_price") or 0)
            out.append(total)
        return out

    def action_post_cost(self):
        self.write({"accounting_state": "posted"})
        return True

    def _mrp_create_cost_draft_move(self):
        """Create idempotent draft account.move(entry) from cost_estimate (no lines yet — stub)."""
        env = getattr(self, "env", None)
        if not env:
            return
        Move = env.get("account.move")
        Journal = env.get("account.journal")
        if not Move or not Journal:
            return
        j = Journal.search([("type", "=", "general")], limit=1)
        if not j.ids:
            j = Journal.search([], limit=1)
        if not j.ids:
            return
        for rec in self:
            if not rec.ids:
                continue
            row = rec.read(["name", "cost_estimate", "cost_draft_move_id"])[0]
            if row.get("cost_draft_move_id"):
                continue
            mo_name = row.get("name") or ""
            origin = f"MFG:{mo_name}"
            existing = Move.search([("invoice_origin", "=", origin), ("move_type", "=", "entry")], limit=1)
            if existing.ids:
                rec.write({"cost_draft_move_id": existing.ids[0]})
                continue
            ce = float(row.get("cost_estimate") or 0)
            if ce <= 0:
                continue
            mv = Move.create(
                {
                    "journal_id": j.ids[0],
                    "move_type": "entry",
                    "invoice_origin": origin,
                    "state": "draft",
                }
            )
            mid = mv.id if hasattr(mv, "id") else (mv.ids[0] if getattr(mv, "ids", None) else None)
            if mid:
                rec.write({"cost_draft_move_id": mid})

    def action_done(self):
        """Post manufacturing cost flag when production completes (Phase 490)."""
        res = super().action_done()
        self._mrp_create_cost_draft_move()
        self.action_post_cost()
        return res
