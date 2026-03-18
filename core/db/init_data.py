"""Default data loading at db init."""

import logging

_logger = logging.getLogger("erp.db")


def load_default_data(env) -> None:
    """Load default records (stages, sequences, company, groups, etc.) when tables are empty."""
    _load_ir_module_module(env)
    _load_ir_actions_menus(env)
    _load_ir_actions_reports(env)
    _load_ir_rules(env)
    _load_ir_ui_views(env)
    _load_res_currency(env)
    _load_res_country(env)
    _load_res_country_state(env)
    _load_res_lang(env)
    _load_res_company(env)
    _load_stock_data(env)
    _load_mrp_data(env)
    _load_account_data(env)
    _load_product_demo(env)
    _load_payment_providers(env)

    try:
        Groups = env.get("res.groups")
        if Groups:
            group_user = Groups.search([("full_name", "=", "base.group_user")])
            if not group_user:
                g = Groups.create({"name": "User", "full_name": "base.group_user"})
                _logger.info("Created default res.groups: base.group_user")
            group_public = Groups.search([("full_name", "=", "base.group_public")])
            if not group_public:
                Groups.create({"name": "Public", "full_name": "base.group_public"})
                _logger.info("Created default res.groups: base.group_public")
            group_portal = Groups.search([("full_name", "=", "base.group_portal")])
            if not group_portal:
                Groups.create({"name": "Portal", "full_name": "base.group_portal"})
                _logger.info("Created default res.groups: base.group_portal")
    except Exception as e:
        _logger.warning("Could not load default groups: %s", e)

    try:
        TaskType = env.get("project.task.type")
        if TaskType and not TaskType.search([]):
            for name, seq, fold in [
                ("Backlog", 1, False),
                ("In Progress", 2, False),
                ("Done", 3, True),
            ]:
                TaskType.create({"name": name, "sequence": seq, "fold": fold})
            _logger.info("Created default project.task.type records")
    except Exception as e:
        _logger.warning("Could not load default project.task.type: %s", e)

    try:
        Stage = env.get("crm.stage")
        if Stage and not Stage.search([]):
            for name, seq, is_won, fold in [
                ("New", 1, False, False),
                ("Qualified", 2, False, False),
                ("Proposition", 3, False, False),
                ("Won", 70, True, False),
                ("Lost", 80, False, True),
            ]:
                Stage.create({"name": name, "sequence": seq, "is_won": is_won, "fold": fold})
            _logger.info("Created default crm.stage records")
    except Exception as e:
        _logger.warning("Could not load default crm.stage: %s", e)

    try:
        ActivityType = env.get("mail.activity.type")
        if ActivityType and not ActivityType.search([]):
            for name, seq in [("Call", 1), ("Meeting", 2), ("Email", 3)]:
                ActivityType.create({"name": name, "sequence": seq})
            _logger.info("Created default mail.activity.type records")
    except Exception as e:
        _logger.warning("Could not load default mail.activity.type: %s", e)

    try:
        HelpdeskStage = env.get("helpdesk.stage")
        if HelpdeskStage and not HelpdeskStage.search([]):
            for name, seq, fold in [
                ("New", 1, False),
                ("In Progress", 2, False),
                ("Solved", 3, True),
            ]:
                HelpdeskStage.create({"name": name, "sequence": seq, "fold": fold})
            _logger.info("Created default helpdesk.stage records")
    except Exception as e:
        _logger.warning("Could not load default helpdesk.stage: %s", e)

    try:
        Tag = env.get("crm.tag")
        if Tag and not Tag.search([]):
            for name in ["Hot", "Cold", "Follow-up", "Qualified", "Demo"]:
                Tag.create({"name": name})
            _logger.info("Created default crm.tag records")
    except Exception as e:
        _logger.warning("Could not load default crm.tag: %s", e)

    try:
        IrSequence = env.get("ir.sequence")
        if IrSequence:
            for code, name in [
                ("crm.lead", "Lead/Opportunity Reference"),
                ("stock.picking", "Transfer Reference"),
                ("account.move", "Journal Entry Reference"),
                ("sale.order", "Sales Order Reference"),
                ("purchase.order", "Purchase Order Reference"),
                ("mrp.production", "Manufacturing Order Reference"),
                ("hr.expense.sheet", "Expense Report Reference"),
                ("hr.payslip", "Payslip Reference"),
                ("account.bank.statement", "Bank Statement Reference"),
            ]:
                existing = IrSequence.search([("code", "=", code)])
                if not existing:
                    IrSequence.create({"code": code, "name": name, "number_next": 0})
                    _logger.info("Created default ir.sequence: %s", code)
    except Exception as e:
        _logger.warning("Could not load default sequences: %s", e)

    try:
        IrCron = env.get("ir.cron")
        if IrCron and not IrCron.search([("model", "=", "base.transient.vacuum")]):
            from datetime import datetime, timedelta
            IrCron.create({
                "name": "Transient model vacuum",
                "model": "base.transient.vacuum",
                "method": "run",
                "interval_minutes": 60,
                "next_run": (datetime.utcnow() + timedelta(minutes=5)).isoformat(),
                "active": True,
            })
            _logger.info("Created cron: Transient model vacuum")
        if IrCron and not IrCron.search([("model", "=", "mail.mail")]):
            from datetime import datetime, timedelta
            IrCron.create({
                "name": "Process email queue",
                "model": "mail.mail",
                "method": "process_email_queue",
                "interval_minutes": 5,
                "next_run": (datetime.utcnow() + timedelta(minutes=2)).isoformat(),
                "active": True,
            })
            _logger.info("Created cron: Process email queue")
        if IrCron and env.get("fetchmail.server") and not IrCron.search([("model", "=", "fetchmail.server")]):
            from datetime import datetime, timedelta
            IrCron.create({
                "name": "Fetch incoming emails",
                "model": "fetchmail.server",
                "method": "run_fetchmail",
                "interval_minutes": 5,
                "next_run": (datetime.utcnow() + timedelta(minutes=1)).isoformat(),
                "active": True,
            })
            _logger.info("Created cron: Fetch incoming emails")
        if IrCron and env.get("ai.rag.reindex") and not IrCron.search([("model", "=", "ai.rag.reindex")]):
            from datetime import datetime, timedelta
            IrCron.create({
                "name": "RAG bulk reindex",
                "model": "ai.rag.reindex",
                "method": "run",
                "interval_minutes": 60,
                "next_run": (datetime.utcnow() + timedelta(minutes=10)).isoformat(),
                "active": True,
            })
            _logger.info("Created cron: RAG bulk reindex")
        if IrCron and env.get("base.db.backup") and not IrCron.search([("model", "=", "base.db.backup")]):
            from datetime import datetime, timedelta
            IrCron.create({
                "name": "Database backup",
                "model": "base.db.backup",
                "method": "run",
                "interval_minutes": 1440,  # daily
                "next_run": (datetime.utcnow() + timedelta(minutes=60)).isoformat(),
                "active": True,
            })
            _logger.info("Created cron: Database backup")
    except Exception as e:
        _logger.warning("Could not create transient vacuum cron: %s", e)

    assign_admin_groups(env)
    _load_dashboard_widgets(env)
    _load_ir_translations(env)


def _load_ir_module_module(env) -> None:
    """Seed ir.module.module with installed modules and versions (Phase 102)."""
    try:
        IrModule = env.get("ir.module.module")
        if not IrModule:
            return
        IrModule.sync_discovered_modules()
        _logger.info("Seeded ir.module.module")
    except Exception as e:
        _logger.warning("Could not load ir.module.module: %s", e)


def _load_ir_actions_menus(env) -> None:
    """Seed ir.actions.act_window and ir.ui.menu from XML data (persistent)."""
    try:
        from core.data.views_registry import load_views_registry
        ActWindow = env.get("ir.actions.act_window")
        Menu = env.get("ir.ui.menu")
        if not ActWindow or not Menu:
            return
        registry = load_views_registry()
        for xml_id, act in registry.get("actions", {}).items():
            existing = ActWindow.search([("xml_id", "=", xml_id)])
            view_mode = act.get("view_mode")
            if isinstance(view_mode, list):
                view_mode = ",".join(view_mode)
            vals = {
                "xml_id": xml_id,
                "name": act.get("name", ""),
                "res_model": act.get("res_model", ""),
                "view_mode": view_mode or "list,form",
                "context": act.get("context", "") or "",
                "domain": act.get("domain", "") or "",
            }
            if existing:
                ActWindow.browse(existing.ids[0]).write(vals)
            else:
                ActWindow.create(vals)
        for m in registry.get("menus", []):
            xml_id = m.get("id", "")
            existing = Menu.search([("xml_id", "=", xml_id)])
            vals = {
                "xml_id": xml_id,
                "name": m.get("name", ""),
                "action_ref": m.get("action", ""),
                "parent_ref": m.get("parent", ""),
                "sequence": m.get("sequence", 10),
            }
            if existing:
                Menu.browse(existing.ids[0]).write(vals)
            else:
                Menu.create(vals)
        _logger.info("Loaded ir.actions.act_window and ir.ui.menu from XML")
    except Exception as e:
        _logger.warning("Could not load ir.actions/menus: %s", e)


def _load_ir_actions_reports(env) -> None:
    """Seed ir.actions.report from default definitions (Phase 110). Metadata-driven report lookup."""
    try:
        Report = env.get("ir.actions.report")
        if not Report:
            return
        defaults = [
            {
                "xml_id": "crm.report_lead_summary",
                "name": "Lead Summary",
                "model": "crm.lead",
                "report_name": "crm.lead_summary",
                "report_file": "crm/report/lead_summary.html",
                "fields_csv": "id,name,type,stage_id,expected_revenue,date_deadline,description",
            },
            {
                "xml_id": "sale.report_saleorder",
                "name": "Sale Order",
                "model": "sale.order",
                "report_name": "sale.report_saleorder",
                "report_file": "sale/report/sale_order_report.html",
                "fields_csv": "id,name,partner_id,date_order,state,amount_total,order_line",
            },
            {
                "xml_id": "account.report_invoice",
                "name": "Invoice",
                "model": "account.move",
                "report_name": "account.report_invoice",
                "report_file": "account/report/invoice_report.html",
                "fields_csv": "id,name,partner_id,journal_id,move_type,state,invoice_origin,line_ids",
            },
            {
                "xml_id": "purchase.report_purchaseorder",
                "name": "Purchase Order",
                "model": "purchase.order",
                "report_name": "purchase.report_purchaseorder",
                "report_file": "purchase/report/purchase_order_report.html",
                "fields_csv": "id,name,partner_id,state,order_line",
            },
            {
                "xml_id": "stock.report_deliveryslip",
                "name": "Delivery Slip",
                "model": "stock.picking",
                "report_name": "stock.report_deliveryslip",
                "report_file": "stock/report/delivery_slip_report.html",
                "fields_csv": "id,name,partner_id,location_id,location_dest_id,origin,state,move_ids",
            },
        ]
        for d in defaults:
            existing = Report.search([("report_name", "=", d["report_name"])])
            vals = {
                "xml_id": d.get("xml_id", ""),
                "name": d["name"],
                "model": d["model"],
                "report_name": d["report_name"],
                "report_file": d["report_file"],
                "fields_csv": d.get("fields_csv", "id,name"),
            }
            if existing:
                Report.browse(existing.ids[0]).write(vals)
            else:
                Report.create(vals)
        _logger.info("Loaded ir.actions.report defaults")
    except Exception as e:
        _logger.warning("Could not load ir.actions.report: %s", e)


def _load_ir_rules(env) -> None:
    """Seed ir.rule from security/ir_rule.xml files (persistent)."""
    try:
        from pathlib import Path
        from core.tools import config
        import xml.etree.ElementTree as ET

        IrRule = env.get("ir.rule")
        if not IrRule:
            return
        for addons_dir in config.get_addons_paths():
            if not addons_dir.exists():
                continue
            for entry in addons_dir.iterdir():
                if not entry.is_dir():
                    continue
                xml_path = entry / "security" / "ir_rule.xml"
                if not xml_path.exists():
                    continue
                module = entry.name
                try:
                    tree = ET.parse(xml_path)
                    for rec in tree.getroot().findall(".//{*}record"):
                        if rec.get("model") != "ir.rule":
                            continue
                        xml_id = rec.get("id", "")
                        full_xml_id = f"{module}.{xml_id}" if xml_id and "." not in xml_id else (xml_id or f"{module}.ir_rule")
                        model_ref = None
                        domain_force = ""
                        name = ""
                        groups_ref = ""
                        active = True
                        perm_read = True
                        perm_write = True
                        perm_create = True
                        perm_unlink = True
                        for f in rec.findall("{*}field"):
                            fn = f.get("name")
                            if fn == "model_id":
                                model_ref = (f.text or "").strip()
                                if model_ref and model_ref.startswith("model_"):
                                    model_ref = model_ref.replace("model_", "").replace("_", ".")
                            elif fn == "domain_force":
                                domain_force = (f.text or "").strip()
                            elif fn == "name":
                                name = (f.text or "").strip()
                            elif fn in ("groups", "groups_ref"):
                                groups_ref = (f.text or "").strip()
                            elif fn == "active":
                                active = (f.text or "").strip() not in ("0", "false", "False")
                            elif fn == "perm_read":
                                perm_read = (f.text or "").strip() not in ("0", "false", "False")
                            elif fn == "perm_write":
                                perm_write = (f.text or "").strip() not in ("0", "false", "False")
                            elif fn == "perm_create":
                                perm_create = (f.text or "").strip() not in ("0", "false", "False")
                            elif fn == "perm_unlink":
                                perm_unlink = (f.text or "").strip() not in ("0", "false", "False")
                        if model_ref and domain_force:
                            existing = IrRule.search([("xml_id", "=", full_xml_id)])
                            vals = {
                                "xml_id": full_xml_id,
                                "name": name or full_xml_id,
                                "model": model_ref,
                                "domain_force": domain_force,
                                "groups_ref": groups_ref,
                                "active": active,
                                "perm_read": perm_read,
                                "perm_write": perm_write,
                                "perm_create": perm_create,
                                "perm_unlink": perm_unlink,
                            }
                            if existing:
                                IrRule.browse(existing.ids[0]).write(vals)
                            else:
                                IrRule.create(vals)
                    _logger.info("Loaded ir.rule from %s", xml_path)
                except Exception as ex:
                    _logger.warning("Could not load ir.rule from %s: %s", xml_path, ex)
    except Exception as e:
        _logger.warning("Could not load ir.rule: %s", e)


def _load_ir_ui_views(env) -> None:
    """Seed ir.ui.view from XML data (persistent)."""
    try:
        import json
        from core.data.views_registry import load_views_registry

        IrUiView = env.get("ir.ui.view")
        if not IrUiView:
            return
        registry = load_views_registry()
        views_by_model = registry.get("views", {})
        for model, view_list in views_by_model.items():
            for v in view_list:
                xml_id = v.get("id", "")
                if not xml_id:
                    continue
                arch_dict = {
                    "type": v.get("type", "list"),
                    "columns": v.get("columns", []),
                    "fields": v.get("fields", []),
                    "default_group_by": v.get("default_group_by", ""),
                    "search_fields": v.get("search_fields", []),
                    "editable": v.get("editable", ""),
                    "search_panel": v.get("search_panel", []),
                    "filters": v.get("filters", []),
                    "group_bys": v.get("group_bys", []),
                }
                if v.get("children"):
                    arch_dict["children"] = v["children"]
                arch_json = json.dumps(arch_dict)
                existing = IrUiView.search([("xml_id", "=", xml_id)])
                vals = {
                    "xml_id": xml_id,
                    "name": v.get("name", ""),
                    "model": model,
                    "type": v.get("type", "list"),
                    "arch": arch_json,
                    "priority": v.get("priority", 16),
                }
                if existing:
                    IrUiView.browse(existing.ids[0]).write(vals)
                else:
                    IrUiView.create(vals)
        _logger.info("Loaded ir.ui.view from XML")
    except Exception as e:
        _logger.warning("Could not load ir.ui.view: %s", e)


def _load_res_currency(env) -> None:
    """Load default currencies (EUR, USD, GBP)."""
    try:
        Currency = env.get("res.currency")
        if not Currency or Currency.search([]):
            return
        for name, symbol, rate in [("EUR", "€", 1.0), ("USD", "$", 1.1), ("GBP", "£", 0.86)]:
            Currency.create({"name": name, "symbol": symbol, "rate": rate})
        _logger.info("Created default res.currency records")
        _load_res_currency_rates(env)
    except Exception as e:
        _logger.warning("Could not load default currencies: %s", e)


def _load_res_currency_rates(env) -> None:
    """Load default currency rates (Phase 96)."""
    try:
        from datetime import date
        Rate = env.get("res.currency.rate")
        Currency = env.get("res.currency")
        if not Rate or not Currency or Rate.search([]):
            return
        today = date.today().isoformat()
        for name, rate in [("EUR", 1.0), ("USD", 1.1), ("GBP", 0.86)]:
            cur = Currency.search([("name", "=", name)], limit=1)
            if cur and cur.ids:
                Rate.create({"currency_id": cur.ids[0], "name": today, "rate": rate})
        _logger.info("Created default res.currency.rate records")
    except Exception as e:
        _logger.warning("Could not load currency rates: %s", e)


def _load_res_country(env) -> None:
    """Load default countries."""
    try:
        Country = env.get("res.country")
        if not Country or Country.search([]):
            return
        for name, code in [
            ("Estonia", "EE"),
            ("United States", "US"),
            ("United Kingdom", "GB"),
            ("Germany", "DE"),
            ("Finland", "FI"),
        ]:
            Country.create({"name": name, "code": code})
        _logger.info("Created default res.country records")
    except Exception as e:
        _logger.warning("Could not load default countries: %s", e)


def _load_res_country_state(env) -> None:
    """Load minimal states (e.g. EE states)."""
    try:
        State = env.get("res.country.state")
        Country = env.get("res.country")
        if not State or not Country or State.search([]):
            return
        ee = Country.search([("code", "=", "EE")], limit=1)
        if ee and ee.ids:
            country_id = ee.ids[0]
            for name, code in [
                ("Harjumaa", "37"),
                ("Hiiumaa", "39"),
                ("Ida-Virumaa", "44"),
                ("Jõgevamaa", "49"),
                ("Järvamaa", "51"),
                ("Läänemaa", "57"),
                ("Lääne-Virumaa", "59"),
                ("Põlvamaa", "65"),
                ("Pärnumaa", "67"),
                ("Raplamaa", "70"),
                ("Saaremaa", "74"),
                ("Tartumaa", "78"),
                ("Valgamaa", "82"),
                ("Viljandimaa", "84"),
                ("Võrumaa", "86"),
            ]:
                State.create({"name": name, "code": code, "country_id": country_id})
            _logger.info("Created default res.country.state records (EE)")
    except Exception as e:
        _logger.warning("Could not load default res.country.state: %s", e)


def _load_res_lang(env) -> None:
    """Load default languages (en, fi)."""
    try:
        Lang = env.get("res.lang")
        if not Lang or Lang.search([]):
            return
        for code, name in [("en_US", "English"), ("fi_FI", "Finnish")]:
            Lang.create({"code": code, "name": name, "active": True})
        _logger.info("Created default res.lang records")
    except Exception as e:
        _logger.warning("Could not load default languages: %s", e)


def _load_res_company(env) -> None:
    """Load default company with EUR currency."""
    try:
        Company = env.get("res.company")
        if not Company or Company.search([]):
            return
        Currency = env.get("res.currency")
        eur = Currency.search([("name", "=", "EUR")], limit=1) if Currency else None
        vals = {"name": "My Company"}
        if eur and eur.ids:
            vals["currency_id"] = eur.ids[0]
        Company.create(vals)
        _logger.info("Created default res.company")
    except Exception as e:
        _logger.warning("Could not load default company: %s", e)


def _load_ir_translations(env) -> None:
    """Load translations from .po files into ir.translation (Phase 94)."""
    try:
        Translation = env.get("ir.translation")
        if not Translation or Translation.search([], limit=1):
            return
        from core.tools import config
        from core.tools.translate import discover_po_files, load_po_file

        paths = config.get_addons_paths()
        if not paths:
            return
        addons_path = paths[0]
        for module, lang, po_path in discover_po_files(addons_path):
            for mod, l, src, val in load_po_file(po_path, module, lang):
                if src and val:
                    existing = Translation.search([["module", "=", mod], ["lang", "=", l], ["src", "=", src]], limit=1)
                    if not existing:
                        Translation.create({"module": mod, "lang": l, "src": src, "value": val, "type": "code"})
        _logger.info("Loaded translations from .po files")
    except Exception as e:
        _logger.warning("Could not load translations: %s", e)


def _load_dashboard_widgets(env) -> None:
    """Load default dashboard widgets (Phase 93, 201)."""
    try:
        from datetime import date
        Widget = env.get("ir.dashboard.widget")
        CrmStage = env.get("crm.stage")
        if not Widget:
            return
        won_ids = []
        if CrmStage:
            won_stages = CrmStage.search([("is_won", "=", True)])
            won_ids = won_stages.ids if won_stages else []
        domain_open = "[('stage_id','not in',%s)]" % won_ids if won_ids else "[]"
        today = date.today().isoformat()
        month_start = date.today().replace(day=1).isoformat()
        widgets = [
            {"name": "Open Leads", "model": "crm.lead", "domain": domain_open, "aggregate": "count", "sequence": 1},
            {"name": "Expected Revenue", "model": "crm.lead", "domain": "[]", "measure_field": "expected_revenue", "aggregate": "sum", "sequence": 2},
            {"name": "My Activities", "model": "mail.activity", "domain": "[('user_id','=',uid)]", "aggregate": "count", "sequence": 3},
            {"name": "Sales This Month", "model": "sale.order", "domain": "[('state','=','sale'),('date_order','>=','%s')]" % month_start, "aggregate": "count", "sequence": 4},
            {"name": "Open Invoices", "model": "account.move", "domain": "[('move_type','=','out_invoice'),('state','=','posted')]", "measure_field": "amount_residual", "aggregate": "sum", "sequence": 5},
            {"name": "Low Stock", "model": "product.product", "domain": "[('qty_available','<',5)]", "aggregate": "count", "sequence": 6},
            {"name": "Overdue Tasks", "model": "project.task", "domain": "[('date_deadline','<','%s')]" % today, "aggregate": "count", "sequence": 7},
        ]
        existing_names = set(w["name"] for w in Widget.search_read([], ["name"]))
        for w in widgets:
            if w["name"] not in existing_names:
                Widget.create(w)
                existing_names.add(w["name"])
        _logger.info("Created default dashboard widgets")
    except Exception as e:
        _logger.warning("Could not load dashboard widgets: %s", e)


def _load_account_data(env) -> None:
    """Load default chart of accounts and journals (Phase 118)."""
    try:
        Account = env.get("account.account")
        Journal = env.get("account.journal")
        if not Account or not Journal:
            return
        for code, name, acc_type in [
            ("1000", "Receivable", "asset_receivable"),
            ("2000", "Payable", "liability_payable"),
            ("4000", "Sales", "income"),
            ("6000", "Purchases", "expense"),
            ("10000", "Bank", "asset_cash"),
        ]:
            if not Account.search([("code", "=", code)]):
                Account.create({"code": code, "name": name, "account_type": acc_type})
        if not Journal.search([("code", "=", "SALE")]):
            Journal.create({"name": "Sales", "code": "SALE", "type": "sale"})
        if not Journal.search([("code", "=", "PURCH")]):
            Journal.create({"name": "Purchase", "code": "PURCH", "type": "purchase"})
        if not Journal.search([("code", "=", "MISC")]):
            Journal.create({"name": "Miscellaneous", "code": "MISC", "type": "general"})
        if not Journal.search([("code", "=", "BANK")]):
            Journal.create({"name": "Bank", "code": "BANK", "type": "bank"})
        _logger.info("Created default account accounts and journals")
    except Exception as e:
        _logger.warning("Could not load account data: %s", e)


def _load_product_demo(env) -> None:
    """Load demo products for shop (Phase 143). Ensures E2E shop tests have products."""
    try:
        Product = env.get("product.product")
        if not Product or Product.search([]):
            return
        for name, price in [("Widget A", 9.99), ("Widget B", 19.50), ("Widget C", 4.99)]:
            Product.create({"name": name, "list_price": price})
        _logger.info("Created demo products for shop")
    except Exception as e:
        _logger.warning("Could not load product demo: %s", e)


def _load_payment_providers(env) -> None:
    """Load demo and manual payment providers (Phase 156)."""
    try:
        Provider = env.get("payment.provider")
        if not Provider or Provider.search([]):
            return
        Provider.create({"name": "Demo", "code": "demo", "state": "enabled"})
        Provider.create({"name": "Bank Transfer", "code": "manual", "state": "enabled"})
        _logger.info("Created payment providers (demo, manual)")
    except Exception as e:
        _logger.warning("Could not load payment providers: %s", e)


def _load_mrp_data(env) -> None:
    """Create production location for MRP (Phase 153)."""
    try:
        Location = env.get("stock.location")
        if not Location:
            return
        # Check if production type exists (mrp extends stock.location)
        existing = Location.search([("type", "=", "production")])
        if existing.ids:
            return  # already seeded
        Location.create({"name": "Production", "type": "production"})
        _logger.info("Created MRP production location")
    except Exception as e:
        _logger.warning("Could not load MRP data: %s", e)


def _load_stock_data(env) -> None:
    """Load default stock locations, warehouse, picking types (Phase 116)."""
    try:
        Location = env.get("stock.location")
        Warehouse = env.get("stock.warehouse")
        PickingType = env.get("stock.picking.type")
        if not Location or not Warehouse or not PickingType:
            return
        if PickingType.search([("code", "=", "outgoing")]):
            return  # already seeded
        stock_loc = Location.create({"name": "Stock", "type": "internal"})
        output_loc = Location.create({"name": "Output", "location_id": stock_loc.id, "type": "internal"})
        supplier_loc = Location.create({"name": "Vendors", "type": "supplier"})
        customer_loc = Location.create({"name": "Customers", "type": "customer"})
        wh = Warehouse.create({
            "name": "Main Warehouse",
            "code": "WH",
            "lot_stock_id": stock_loc.id,
            "wh_output_stock_loc_id": output_loc.id,
        })
        PickingType.create({
            "name": "Delivery Orders",
            "code": "outgoing",
            "warehouse_id": wh.id,
            "default_location_src_id": stock_loc.id,
            "default_location_dest_id": customer_loc.id,
        })
        PickingType.create({
            "name": "Receipts",
            "code": "incoming",
            "warehouse_id": wh.id,
            "default_location_src_id": supplier_loc.id,
            "default_location_dest_id": stock_loc.id,
        })
        _logger.info("Created default stock locations and picking types")
    except Exception as e:
        _logger.warning("Could not load stock data: %s", e)


def assign_admin_groups(env) -> None:
    """Assign base.group_user and company to admin user. Call after admin creation."""
    try:
        User = env.get("res.users")
        Groups = env.get("res.groups")
        Company = env.get("res.company")
        if User and Groups and Company:
            admin = User.search([("login", "=", "admin")])
            if admin:
                group_user = Groups.search([("full_name", "=", "base.group_user")])
                company = Company.search([])
                updates = {}
                if company and company.ids:
                    cid = company.ids[0]
                    updates["company_id"] = cid
                    updates["company_ids"] = [(6, 0, [cid])]
                if group_user and group_user.ids:
                    updates["group_ids"] = [(6, 0, group_user.ids)]
                if updates:
                    for uid in admin.ids:
                        User.browse(uid).write(updates)
                    _logger.info("Assigned admin user to base.group_user and default company")
    except Exception as e:
        _logger.warning("Could not assign admin groups: %s", e)
