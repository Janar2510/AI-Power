"""Default data loading at db init."""

import logging

_logger = logging.getLogger("erp.db")


def load_default_data(env) -> None:
    """Load default records (stages, sequences, company, groups, etc.) when tables are empty."""
    _load_ir_actions_menus(env)
    _load_ir_rules(env)
    _load_ir_ui_views(env)
    _load_res_currency(env)
    _load_res_country(env)
    _load_res_country_state(env)
    _load_res_lang(env)
    _load_res_company(env)

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
    except Exception as e:
        _logger.warning("Could not load default groups: %s", e)

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
            for code, name in [("crm.lead", "Lead/Opportunity Reference")]:
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
    except Exception as e:
        _logger.warning("Could not create transient vacuum cron: %s", e)

    assign_admin_groups(env)


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
                        if model_ref and domain_force:
                            existing = IrRule.search([("xml_id", "=", full_xml_id)])
                            vals = {
                                "xml_id": full_xml_id,
                                "name": name or full_xml_id,
                                "model": model_ref,
                                "domain_force": domain_force,
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
    except Exception as e:
        _logger.warning("Could not load default currencies: %s", e)


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
                    updates["company_id"] = company.ids[0]
                if group_user and group_user.ids:
                    updates["group_ids"] = [(6, 0, group_user.ids)]
                if updates:
                    for uid in admin.ids:
                        User.browse(uid).write(updates)
                    _logger.info("Assigned admin user to base.group_user and default company")
    except Exception as e:
        _logger.warning("Could not assign admin groups: %s", e)
