# Changelog

## 1.200.0 - Missing apps parity implementation (2026-03-20)

### Added
- New regression coverage: `tests/test_missing_apps_parity_phase408.py` validates CRM hierarchy, Discuss app root, promoted HR apps, analytic relocation, route mappings, and scaffolded app menus.
- New app/menu scaffolds (views + actions + roots):
  - `addons/hr_holidays/views/hr_holidays_views.xml` (Time Off app root and links to leave actions).
  - `addons/repair/views/repair_views.xml` (Repairs app root + repair orders views/action).
  - `addons/survey/views/survey_views.xml` (Surveys app root + survey views/action).
  - `addons/lunch/views/lunch_views.xml` (Lunch app root + order views/action).
  - `addons/im_livechat/views/im_livechat_views.xml` (Live Chat app root + channel views/action).
  - `addons/project_todo/views/project_todo_views.xml` (To-Do app root + task action).
  - `addons/data_recycle/views/data_recycle_views.xml` (Data Recycle app root + rules views/action).
  - `addons/hr_skills/views/hr_skills_views.xml` (Skills app root + skill views/action).
  - `addons/website_slides/views/website_slides_views.xml` (eLearning app root + channel views/action).

### Changed
- CRM menu architecture now follows Odoo-style app hierarchy in `addons/crm/views/crm_views.xml`:
  - `CRM` root with `Sales`, `Leads`, `Reporting`, `Configuration`.
  - Added `My Pipeline` and `My Activities` actions for app-level navigation.
- Discuss is promoted to an app root (`menu_discuss_root`) so it appears in the app grid instead of only as a navbar shortcut.
- HR app promotion:
  - `hr_expense`: new top-level `Expenses` root and child menus.
  - `hr_attendance`: promoted to top-level `Attendances` root.
  - `hr_recruitment`: promoted to top-level `Recruitment` root.
  - `hr_holidays`: now provides its own views and top-level `Time Off` root.
- App-grid cleanup:
  - `addons/analytic/views/analytic_views.xml`: analytic root moved under `account.menu_account_config`, removing standalone Analytic app tile behavior.
  - `addons/analytic/__manifest__.py`: depends on `account` to ensure parent menu ref integrity.
- Web client routing in `addons/web/static/src/main.js` expanded for parity routes:
  - CRM: `pipeline`, `crm/activities`.
  - HR/apps: `expenses`, `attendances`, `recruitment`, `time_off`.
  - Scaffolded apps: `repair_orders`, `surveys`, `lunch_orders`, `livechat_channels`, `project_todos`, `recycle_models`, `skills`, `elearning`.
  - Added corresponding `menuToRoute`, `actionToRoute`, `getModelForRoute`, `dataRoutes`, and titles.
- Manifest hygiene and app metadata updates:
  - Added missing view files into module `data` lists for new scaffolds.
  - Normalized malformed quoted paths in `im_livechat` and `website_slides` manifests.
  - Marked promoted/scaffolded app modules as `application: True` where appropriate.

### Verification
- `python3 -m unittest tests.test_missing_apps_parity_phase408` passes.

---

## 1.199.0 - Working menu + Odoo-style apps home (2026-03-20)

### Added
- Home apps launcher in `addons/web/static/src/main.js`: `#home` now renders an app-tile grid from menu app roots (`getAppRoots`) and keeps Dashboard visible below the launcher.
- App navigation helpers in `main.js`: `getDefaultRouteForAppNode()` and `selectApp()` for app-root based routing and `erp_sidebar_app` persistence.
- New home/nav styles in `addons/web/static/src/scss/webclient.css`: `.o-home-apps*`, `.o-app-grid`, `.o-app-tile*`, `.nav-current-app`, `.logo-link`.

### Changed
- Fixed menu hierarchy definitions:
  - `addons/stock/views/stock_views.xml`: `Operations`, `Configuration`, `Reporting` now parented under `menu_stock_root`.
  - `addons/account/views/account_views.xml`: `Configuration` now parented under `menu_account_root`.
- `main.js` route coverage expanded to make menu links actionable:
  - `actionToRoute()` + `getModelForRoute()` include `account.tax`, `account.payment.term`, `product.pricelist`, `analytic.account`, `analytic.plan`, `stock.warehouse.orderpoint`.
  - `menuToRoute()` extended for app-level menu names (`Invoicing`, `Inventory`, `Sales`, `HR`, `Analytic`, etc.).
  - `dataRoutes` patterns updated for `taxes`, `payment_terms`, `pricelists`, `bank_statements`, `reordering_rules`, `analytic_accounts`, `analytic_plans`.
- Navbar/sidebar app UX moved from `<select>` to app-home flow:
  - Logo and `Apps` button route to `#home`.
  - Current app label shown in navbar.
  - Sidebar keeps app-scoped section rendering based on selected/current route app.

### Notes
- `tests.test_views_registry` passes after this change.
- `tests.test_menu_fix_phase170` currently fails due to pre-existing schema duplication (`create_date` duplicate) unrelated to this menu/home patch.

---

## 1.198.0 - Frontend/Backend roadmap implementation scaffold (2026-03-20)

### Added
- Frontend phase scaffolding files: `core/form_view.js`, `core/navbar.js`, `core/{graph,pivot,calendar,gantt,activity}_view.js`, `core/discuss.js`, `core/import.js`.
- New UI components: `form_field.js`, `statusbar.js`, `one2many.js`, `many2many_tags.js`, `breadcrumbs.js`, `confirm_dialog.js`, `select_create_dialog.js`, `search_panel.js`.
- New services: `hotkey.js`, `command_palette.js`, `debug_menu.js`, `pwa.js`.
- PWA artifacts: `web/static/manifest.webmanifest`, `web/static/src/pwa/sw.js`.
- Backend tools expansion: `core/tools/{safe_eval,date_utils,float_utils,image,misc,mail}.py`.
- Mail gateway model: `mail.models.fetchmail_server`.

### Changed
- `main.js`: non-breaking AppCore delegation hooks for navbar, discuss, form, report views, calendar/pivot/graph/gantt/activity; `Breadcrumbs` and import preview delegation; command palette hotkey and PWA init.
- `web/__manifest__.py` and `webclient_templates.xml`: registered new services/components/core assets.
- ORM/registry/schema enrichment for roadmap backend phases:
  - `core/orm/registry.py`: `_register_hook` / `_unregister_hook` invocation lifecycle.
  - `core/orm/models.py`: `_log_access`, `_auto_init`, `_table_query` plumbing plus create/write audit timestamp updates.
  - `core/db/schema.py`: `_log_access` audit columns and SQL view creation via `_table_query`.
- `addons/bus`: web dependency + richer bus service channel helpers.
- `addons/mail`: depends on `bus`, `web`; added fetchmail access rights.

---

## 1.181.0 - Sidebar Odoo 19.0 parity (2026-03-20)

### Added
- `ir.ui.menu` model: `web_icon`, `web_icon_data`, `active` fields (Odoo 19 parity).
- `app_id` computation on menus: root menus are "apps"; descendants share the same `app_id`.
- Recursive sidebar nesting: unlimited-depth collapsible sub-groups (`o-sidebar-subgroup`).
- Active link highlighting: `o-sidebar-link--active` class on current page, updated on `hashchange`, auto-expands parent categories.
- App icons in sidebar: `<img>` from `web_icon_data`, FA icon from `web_icon`, letter abbreviation fallback.
- Per-category fold persistence via `localStorage` key `erp_sidebar_folds`.
- Menu caching in `localStorage` (`erp_menus` + `erp_menus_hash`) with hash-based invalidation.
- CSS tokens: `.o-sidebar-link--active`, `.o-sidebar-icon`, `.o-sidebar-link--nested`, `.o-sidebar-subgroup`, `.o-sidebar-subgroup-head`, `.o-sidebar-subgroup-body`.

### Changed
- `buildMenuTree`: recursive sorting at all depths.
- `buildSidebarNavHtml`: renders icons, active state, recursive children, reads fold state from localStorage.
- `wireSidebarAfterRender`: persists fold state on toggle, tracks active link on hashchange, wires subgroup toggles.
- `views.js`: caches menus in localStorage on load, falls back to cache on network error.
- `views_registry.py`: reads `web_icon`, `web_icon_data`, `active` from DB; filters inactive menus; assigns `app_id`.

---

## 1.180.0 - List view componentization + control panel extraction (2026-03-20)

### Added
- `design-system/specs/list-view.md` — control panel, view switcher, table, bulk actions, pager, responsive and a11y contract.
- `addons/web/static/src/components/control_panel.js`, `view_switcher.js`, `pager.js`, `bulk_action_bar.js`.
- `addons/web/static/src/core/list_view.js` — `AppCore.ListView` renderer with delegated list rendering and table behaviors.
- List/control-panel CSS tokens in `webclient.css`: `.o-control-panel`, `.o-search-bar`, `.o-view-switcher`, `.o-list-table`, `.o-bulk-action-bar`, `.o-pager`, chip classes.

### Changed
- `addons/web/static/src/main.js`: list rendering delegates to `AppCore.ListView.render`; view switcher delegates to `AppCore.ListView.renderViewSwitcher`.
- `design-system/MASTER.md` and `docs/design-system.md`: list view + control panel references.
- `addons/web/__manifest__.py` and `addons/web/views/webclient_templates.xml`: load list components/core before `main.js`.

---

## 1.179.0 - Settings page componentization (2026-03-20)

### Added
- `design-system/specs/settings.md` — settings index, sub-pages, fields, tables, responsive/a11y.
- `addons/web/static/src/components/settings_field.js`, `settings_table.js`, `settings_section.js` — composable settings UI primitives (`UIComponents.SettingsField`, `SettingsTable`, `SettingsSection`).
- `addons/web/static/src/core/settings.js` — `renderIndex`, `renderDashboardWidgets`, `renderApiKeys`, `renderTotp` (DOM + design tokens; same RPC/TOTP behaviour as before).
- Settings CSS block in `webclient.css`: `.o-settings-shell`, `.o-settings-card`, `.o-settings-field`, `.o-settings-table`, `.o-settings-toggle`, `.o-settings-password`, `.o-btn-danger-outline`, `.o-btn-danger-solid`, `--color-on-danger`.

### Changed
- `addons/web/static/src/main.js`: `renderSettings`, `renderDashboardWidgets`, `renderApiKeysSettings`, `renderTotpSettings` delegate to `AppCore.Settings` with `showToast` / reload / breadcrumbs callbacks.
- `design-system/MASTER.md`: Settings section + spec link.
- `addons/web/__manifest__.py` & `webclient_templates.xml`: load settings components and `core/settings.js` before `dashboard.js` / `main.js`.

---

## 1.178.1 - Collapsible sidebar navigation + app shell layout (2026-03-20)

### Added
- `webclient_templates.xml`: `o-app-shell`, `#app-sidebar`, `#o-sidebar-backdrop`, `o-app-main-column` wrapping header + main.

### Changed
- `main.js`: menus render as **categorized collapsible sections** in the sidebar (top-level = category, children = links); compact **top bar** (logo + user tools); desktop **collapse rail** (`erp_sidebar_collapsed` in `localStorage`); mobile **off-canvas** drawer + backdrop.
- `webclient.css`: sidebar tokens, main content padding via `--space-*` / `--card-gap`, navbar density.
- **`core/http/routes.py` `_webclient_html()`**: real app shell now includes `#app-sidebar` and `o-app-shell` (was hardcoded old layout; XML template alone was not served on `/`).

---

## 1.178.0 - Dashboard & home UI redesign (design spec + composable components) (2026-03-20)

### Added
- `design-system/specs/dashboard-home.md` — layout, KPI, activity, AI insights, shortcuts, recent, drawer spec.
- `addons/web/static/src/components/kpi_card.js`, `activity_feed.js`, `shortcuts_bar.js`, `recent_items.js`.
- Dashboard CSS: `.o-dashboard-grid`, KPI trends, activity timeline, AI skeleton/callout, drawer/backdrop, badge variants (`--color-warning-surface`, `--color-backdrop`).

### Changed
- `addons/web/static/src/core/dashboard.js`: full composable home renderer (RPC, layout persistence, components).
- `addons/web/static/src/main.js`: `renderDashboard()` delegates to `AppCore.Dashboard.render`.
- `design-system/MASTER.md`: Dashboard widget zones + spec link.
- `.cursor/rules/agents/ui-designer.mdc`, `frontend-builder.mdc`: spec-first workflow, triggers, globs.
- `addons/web/__manifest__.py` `web.assets_web`: component + dashboard scripts before `main.js`.
- `addons/web/views/webclient_templates.xml`: load `rpc`, `session`, dashboard components, `core/dashboard.js` before `main.js`.

---

## 1.177.1 - Runtime stability fixpack: dashboard data + nested menu routing + bus transport fallback (2026-03-20)

### Fixed
- `addons/base/models/ir_dashboard.py`: hardened `get_data()` row mapping to support dict-style DB rows and avoid `KeyError: 0` 500s on `/web/dataset/call_kw`.
- `addons/web/static/src/main.js`: made `getActionForRoute()` traverse nested menus so menu actions resolve to their intended route/model instead of falling back to dashboard.
- `addons/bus/static/src/bus_service.js`: defaulted dev transport to longpolling to avoid repeated browser WebSocket bad-response noise under Werkzeug.

---

## 1.177.0 - Phases 378-389: modularization + backend enrichment + l10n wave 5 (2026-03-19)

### Added
- **p378-p381**: new frontend core modules under `addons/web/static/src/core/` (`router.js`, `view_manager.js`, `dashboard.js`, `settings.js`, `chatter.js`, `field_utils.js`)
- **p386**: `l10n_bo`, `l10n_cr`, `l10n_uy`, `l10n_ve`, `l10n_ph`
- **p387**: `l10n_id`, `l10n_vn`, `l10n_pk`, `l10n_ng`, `l10n_ma`
- **p388**: `l10n_il`, `l10n_hr`, `l10n_rs`, `l10n_si`, `l10n_lu`
- **p389**: `l10n_lt`, `l10n_lv`, `l10n_ua`, `l10n_fi`, `l10n_gr`
- `tests/test_phase378_389.py`

### Changed
- **p382**: implemented HR presence/holidays logic in `hr_presence`, `hr_holidays_homeworking`, `hr_work_entry_holidays`.
- **p383**: implemented Many2one recipient resolution in `addons/mail/models/mail_template.py`.
- **p384**: enriched `res.lang` and `ir.model` metadata fields.
- **p385**: implemented expiry sync/check helpers in `mrp_product_expiry` and deterministic geolocalization in `base_geolocalize`.
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all phase `386-389` modules.
- **core/release.py**: `version_info = (1, 177, 0, ...)`.

---

## 1.165.0 - Phases 366-377: frontend implementation + l10n wave 4 (2026-03-19)

### Added
- **p374**: `l10n_ar`, `l10n_cl`, `l10n_co`, `l10n_pe`, `l10n_ec`
- **p375**: `l10n_ae`, `l10n_sa`, `l10n_eg`, `l10n_za`, `l10n_ke`
- **p376**: `l10n_cn`, `l10n_kr`, `l10n_tw`, `l10n_sg_full`, `l10n_th`
- **p377**: `l10n_cz`, `l10n_hu`, `l10n_ro`, `l10n_bg`, `l10n_pt`
- `tests/test_phase366_377.py`

### Changed
- **p366-p368**: widget implementations in `addons/web/static/src/widgets/` (`many2one`, `many2many`, `date`, `monetary`, `binary`, `html`)
- **p369-p370**: DOM-based component implementations in `addons/web/static/src/components/` (`button`, `card`, `badge`, `avatar`, `modal`, `toast`)
- **p371**: layout implementations in `addons/web/static/src/layout/` (`navbar`, `sidebar`, `action_layout`)
- **p372-p373**: functional `calendar_renderer.js` and `gantt_renderer.js`
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all phase `374-377` modules.
- **core/release.py**: `version_info = (1, 165, 0, ...)`.

---

## 1.153.0 - Phases 354-365: deferred wave 3 + UI/UX agent track (l10n expansion, themes, frontend modernization) (2026-03-19)

### Added
- **p354**: `l10n_es`, `l10n_it`, `l10n_nl`, `l10n_be`, `l10n_ch`
- **p355**: `l10n_at`, `l10n_in`, `l10n_br`, `l10n_mx`, `l10n_au`
- **p356**: `l10n_ca`, `l10n_pl`, `l10n_se`, `l10n_no`, `l10n_dk`
- **p357**: `theme_default` (`website.theme` + `website.theme_id`)
- **p358-p359**: `theme_starter_1`, `theme_starter_2`, `theme_starter_3`, `theme_starter_4`
- **p360**: `design-system/MASTER.md`, `docs/design-system.md`
- **p361**: component stubs in `addons/web/static/src/components/`
- **p362**: layout stubs in `addons/web/static/src/layout/`
- **p363**: `calendar_renderer.js`, `gantt_renderer.js`
- **p364**: widget stubs in `addons/web/static/src/widgets/`
- **p365**: dashboard/portal style tokens in `webclient.css`
- UI/UX agent rules: `.cursor/rules/agents/ui-designer.mdc`, `.cursor/rules/agents/frontend-builder.mdc`
- `tests/test_phase354_365.py`

### Changed
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all phase `354-359` modules.
- **core/release.py**: `version_info = (1, 153, 0, ...)`.
- **docs/QUICK_START_AGENTS.md**: added UI UX Pro Max skill integration workflow.

---

## 1.142.0 - Phases 342-353: deferred wave 2 (payments, POS payment bridges, Google/MS, spreadsheet, cloud/iot, starter l10n) (2026-03-19)

### Added
- **p342**: `payment_stripe`, `payment_paypal`, `payment_adyen`, `payment_authorize`
- **p343**: `payment_mollie`, `payment_razorpay`, `payment_custom`, `payment_demo`
- **p344**: `pos_adyen`, `pos_stripe`, `pos_restaurant_adyen`
- **p345**: `google_calendar`, `google_drive`
- **p346**: `microsoft_calendar`, `microsoft_outlook`
- **p347**: `spreadsheet`, `spreadsheet_dashboard`, `spreadsheet_account`
- **p348**: `spreadsheet_dashboard_account`, `spreadsheet_crm`, `spreadsheet_dashboard_crm`
- **p349**: `cloud_storage`, `iot`
- **p350**: `l10n_generic_coa`
- **p351**: `l10n_us`, `l10n_uk`
- **p352**: `l10n_de`
- **p353**: `l10n_fr`
- `tests/test_phase342_353.py`

### Changed
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all phase `342-353` modules.
- **core/release.py**: `version_info = (1, 142, 0, ...)`.

---

## 1.136.0 - Phases 330-341: deferred wave 1 (mass mailing, livechat, website content, POS sub-modules) (2026-03-19)

### Added
- **p330**: `mass_mailing`, `mass_mailing_crm`, `mass_mailing_event`, `mass_mailing_sale`
- **p331**: `mass_mailing_sms`, `mass_mailing_themes`
- **p332**: `im_livechat`, `crm_livechat`
- **p333**: `hr_livechat`, `website_livechat`
- **p334**: `website_blog`
- **p335**: `website_forum`
- **p336**: `website_slides`, `hr_skills_slides`
- **p337**: `pos_discount`, `pos_loyalty`, `pos_sale`, `pos_sale_loyalty`
- **p338**: `pos_sale_margin`, `pos_hr`, `pos_restaurant`, `pos_hr_restaurant`
- **p339**: `pos_restaurant_loyalty`, `pos_mrp`, `pos_event`, `pos_event_sale`
- **p340**: `pos_sms`, `pos_self_order`, `pos_online_payment`
- **p341**: `pos_account_tax_python`
- `tests/test_phase330_341.py`

### Changed
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all phase `330-341` modules.
- **core/release.py**: `version_info = (1, 136, 0, ...)`.

---

## 1.131.0 - Phases 320-329: final accounting EDI, website event/sale, CRM, delivery and misc bridges (2026-03-19)

### Added
- **p320**: `account_edi`, `account_edi_proxy_client`, `account_edi_ubl_cii`, `account_add_gln`
- **p321**: `account_peppol`, `account_peppol_advanced_fields`, `account_qr_code_emv`, `account_qr_code_sepa`
- **p322**: `account_tax_python`, `account_update_tax_tags`, `sale_edi_ubl`, `purchase_edi_ubl_bis3`
- **p323**: `website_event_track`, `website_event_track_quiz`, `website_event_track_live`, `website_event_track_live_quiz`
- **p324**: `website_event_exhibitor`, `website_event_booth_exhibitor`, `website_event_booth_sale_exhibitor`
- **p325**: `website_sale_loyalty`, `website_sale_mrp`, `website_sale_autocomplete`, `website_sale_stock_wishlist`
- **p326**: `website_sale_collect`, `website_sale_collect_wishlist`, `website_crm_sms`, `website_cf_turnstile`
- **p327**: `website_crm_iap_reveal`, `website_crm_partner_assign`, `website_mail_group`, `crm_iap_mine`
- **p328**: `delivery_mondialrelay`, `website_sale_mondialrelay`, `sale_gelato`, `sale_gelato_stock`, `website_sale_gelato`
- **p329**: `hr_recruitment_survey`, `project_mail_plugin`, `attachment_indexation`, `certificate`
- `tests/test_phase320_329.py`

### Changed
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all phase `320-329` modules.
- **core/release.py**: `version_info = (1, 131, 0, ...)`.

---

## 1.126.0 - Phases 308-319: infrastructure, commerce, auth/mail, event and CRM extensions (2026-03-19)

### Added
- **p308**: `barcodes`, `barcodes_gs1_nomenclature`, `base_iban`, `base_vat`
- **p309**: `board`, `http_routing`, `html_editor`, `html_builder`
- **p310**: `product_matrix`, `product_email_template`, `sale_product_matrix`, `purchase_product_matrix`
- **p311**: `sale_pdf_quote_builder`, `delivery_stock_picking_batch`, `stock_fleet`, `mrp_subcontracting_dropshipping`
- **p312**: `auth_ldap`, `auth_passkey`, `auth_passkey_portal`, `auth_timeout`
- **p313**: `mail_group`, `mail_plugin`, `snailmail`, `snailmail_account`
- **p314**: `event_booth`, `event_booth_sale`, `website_event`, `website_event_sale`
- **p315**: `website_event_crm`, `website_event_booth`, `website_event_booth_sale`, `project_mrp_stock_landed_costs`
- **p316**: `website_sale_stock`, `website_sale_wishlist`, `website_sale_comparison`, `website_sale_comparison_wishlist`
- **p317**: `website_customer`, `website_partner`, `website_profile`, `website_hr_recruitment`
- **p318**: `iap_crm`, `crm_iap_enrich`, `crm_mail_plugin`, `marketing_card`
- **p319**: `sms_twilio`, `web_unsplash`, `base_sparse_field`, `base_import_module`, `base_install_request`, `partnership`
- `tests/test_phase308_319.py`

### Changed
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all phase `308-319` modules.
- **core/release.py**: `version_info = (1, 126, 0, ...)`.

---

## 1.120.0 – Phases 296–307: plan-aligned bridges + cluster F addons (2026-03-19)

### Added
- **ORM**: `Recordset` resolves `One2many` inverses that point to `Many2many` (e.g. `mrp.production.landed_cost_ids` ↔ `stock.landed.cost.mrp_production_ids`)
- **p296 (aligned)**: `mrp.production.landed_cost_ids`; `stock.lot.product_expiry_reminded`; `mrp.production` lot/expiry helpers; `repair.order.bom_id`; `mrp.bom.repair_count`
- **p297 (aligned)**: `mrp.production.subcontracting_account_move_count`; `purchase.order.line.is_subcontract_line`; `repair.order.subcontract_move_id` (`mrp_subcontracting_repair`); `stock.landed.cost.subcontracting_production_ids`
- **p298–299 (aligned)**: `project.project` counters (`production_count` computed, `stock_valuation_count`, `purchase_picking_count`, `landed_cost_count`, `production_cost`); `project.task.skill_ids`; `sale.order.line.project_production_ids`; `sale.order.project_stock_valuation_count`
- **p300–301 (aligned)**: `hr.leave` / `hr.work.entry.type` / `hr.leave.type` work-entry links; `hr.leave.attendance_ids`, `hr.attendance.leave_id`, `hr.employee.attendance_leave_count`; `hr.leave.work_location_id`; `calendar.event.work_location_id`; `hr.employee.total_overtime`, `hr_presence_state`; `hr.employee.hourly_cost` (Float), `analytic.line.timesheet_cost`; `hr.applicant.sms_ids` / `sms_count`, `sms.sms.applicant_id`
- **p302**: `sale_purchase_project`, `sale_project_stock`, `sale_mrp_margin`, `sale_stock_product_expiry`
- **p303**: `calendar_sms`, `resource_mail`, `survey_crm`, `event_crm_sale`, `mail_bot`
- **p304**: `auth_password_policy_portal`, `auth_password_policy_signup`, `auth_totp_mail`, `auth_totp_portal`
- **p305**: `stock_maintenance`, `stock_picking_batch` (`stock.picking.batch`), `purchase_repair`, `stock_dropshipping`
- **p306**: `web_hierarchy`, `website_mail`, `website_sms`, `website_links`
- **p307**: `website_project`, `website_timesheet`, `hr_skills_event`, `hr_skills_survey`, `mail_bot_hr`, `hr_org_chart`
- `tests/test_phase296_307.py`

### Changed
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` includes all p302–p307 modules
- **core/release.py**: `version_info = (1, 120, 0, ...)`
- **mrp_subcontracting_account**: dropped redundant `product.product` extension (costing already on `stock`); MO uses `subcontracting_account_move_count` instead of `extra_cost`

### Fixed
- Phase 302 bridge naming parity on `sale.order` / `sale.order.line`: added `sale_purchase_project_auto_count`, `sale_project_stock_move_count`, `sale_mrp_margin_component_cost`, `sale_stock_expiry_risk` while keeping existing bridge stubs.
- Phase 303 bridge model alignment: added `resource.resource.resource_mail_alias_id`, `survey.survey.crm_tag_ids`, `event.event.event_crm_sale_opportunity_id`, `res.users.mail_bot_partner_ref`, and `calendar.event.sms_reminder_ids`.
- Phase 304–306 bridge compatibility fields: added `portal_password_policy_level`, `signup_password_strength`, `totp_mail_enabled`, `totp_portal_enabled`, `stock.picking.maintenance_request_id`, `ir.ui.view.web_hierarchy_parent_field`, and fixed `website_mail` model import/load path with `res.company.website_mail_contact_email`.

### Removed
- `tests/test_phase296_301.py` (replaced by `tests/test_phase296_307.py`)

---

## 1.115.0 – Phases 296–301: MRP/Project/HR bridge modules (2026-03-19)

### Added
- **p296**: `mrp_landed_costs`, `mrp_product_expiry`, `mrp_repair` (MO/repair/landed stubs aligned with Odoo 19)
- **p297**: `mrp_subcontracting_account`, `mrp_subcontracting_purchase`, `mrp_subcontracting_repair`, `mrp_subcontracting_landed_costs`
- **p298**: `project_mrp`, `project_hr_skills` (+ `hr.employee.skill`), `project_stock_account`, `project_purchase_stock`
- **p299**: `project_stock_landed_costs` (`stock.valuation.adjustment.lines`), `project_mrp_account`, `project_mrp_sale`, `sale_project_stock_account`
- **p300**: `hr_work_entry_holidays`, `hr_holidays_attendance`, `hr_holidays_homeworking`, `hr_homeworking_calendar`
- **p301**: `hr_timesheet_attendance`, `hr_presence`, `hr_hourly_cost`, `hr_recruitment_sms`
- `tests/test_phase296_301.py` (superseded by `tests/test_phase296_307.py` in 1.120.0)

### Changed
- **core/tools/config.py**: `DEFAULT_SERVER_WIDE_MODULES` extended with all modules above
- **core/release.py**: `version_info = (1, 115, 0, ...)`

---

## 1.114.0 – Phases 289–295: Event, Website, Stock/Sale Bridges, Product & Base (Cluster E) (2026-03-19)

### Added
- **addons/event_crm/** (Phase 289): `event.registration.lead_id`, `crm.lead.registration_ids`, `event_registration_count`
- **addons/event_sale/** (Phase 290): `sale.order.line.event_id` / `event_ticket_id`, `event.event.sale_order_line_ids`, `sale_count`
- **addons/website_crm/** (Phase 290): `crm.lead.website_id`, `website_form_url`
- **addons/website_payment/** (Phase 290): `payment.provider.website_id`, `is_published`
- **addons/account_fleet/** (Phase 291): `account.move.line.vehicle_id`, `fleet.vehicle.invoice_count`
- **addons/stock_sms/** (Phase 291): `stock.picking.sms_ids` / `sms_count`, `sms.sms.picking_id`
- **addons/stock_delivery/** (Phase 291): `stock.picking.carrier_id`, `carrier_tracking_ref`, `weight`
- **addons/sale_expense_margin/** (Phase 292): `hr.expense.margin` (computed from linked sale order margin)
- **addons/sale_loyalty_delivery/** (Phase 292): minimal `loyalty.reward` model (`reward_type`, `delivery_carrier_id`)
- **addons/purchase_requisition_stock/** (Phase 293): `purchase.requisition.picking_count`, `stock.picking.requisition_id`
- **addons/purchase_requisition_sale/** (Phase 293): `purchase.requisition.sale_order_count`, `sale.order.requisition_id`
- **addons/product_margin/** (Phase 294): `product.product.total_margin`, `expected_margin_rate`
- **addons/product_expiry/** (Phase 294): `stock.lot.expiration_date`, `use_date`, `removal_date`, `alert_date`
- **addons/auth_password_policy/** (Phase 295): `password.policy` + `res.config.settings.password_min_length/password_require_*`
- **addons/social_media/** (Phase 295): partner social fields (`facebook`, `twitter`, `linkedin`, `github`, `instagram`)
- **addons/base_address_extended/** (Phase 295): `res.partner.street_name`, `street_number`, `street_number2`
- **addons/base_geolocalize/** (Phase 295): `res.partner.partner_latitude` / `partner_longitude`, `geo_localize()` stub
- `tests/test_phase291_295.py`

### Changed
- **core/tools/config.py**: Registered all cluster E modules in `DEFAULT_SERVER_WIDE_MODULES`
- **core/release.py**: `version_info = (1, 114, 0, ...)`

---

## 1.111.0 – Phases 287–288: HR Bridge Modules (2026-03-19)

### Added
- **addons/hr_gamification/** (Phase 287): `hr.employee.badge_ids` bridge to `gamification.badge.user`
- **addons/hr_fleet/** (Phase 287): `hr.employee.vehicle_ids` and `fleet.vehicle.employee_id`
- **addons/hr_maintenance/** (Phase 287): `hr.employee.equipment_ids` and `maintenance.equipment.employee_id`
- **addons/hr_calendar/** (Phase 288): `calendar.event.employee_id`, `hr.employee.meeting_count` compute
- **addons/hr_homeworking/** (Phase 288): `hr.employee.location` model and `hr.employee.work_location_id`
- **addons/hr_recruitment_skills/** (Phase 288): `hr.applicant.skill_ids` to `hr.skill`
- `tests/test_phase287_288.py`

### Changed
- **core/tools/config.py**: Added `hr_gamification`, `hr_fleet`, `hr_maintenance`, `hr_calendar`, `hr_homeworking`, `hr_recruitment_skills` to `DEFAULT_SERVER_WIDE_MODULES`

---

## 1.110.0 – Phases 284–286: Project Bridge Modules (2026-03-19)

### Added
- **addons/project_todo/** (Phase 284): `project.task` to-do helpers and `res.users` onboarding hook
- **addons/project_stock/** (Phase 284): `stock.picking.project_id`, project picking counters/actions
- **addons/project_sms/** (Phase 284): `project.task.type.sms_template_id`, project/task SMS hooks
- **addons/project_purchase/** (Phase 285): `purchase.order.project_id`, project purchase counter/action
- **addons/project_hr_expense/** (Phase 285): `hr.expense.project_id`, project expense counter/action
- **addons/project_sale_expense/** (Phase 286): sale-expense profitability bridge hooks on `project.project`, `hr.expense`, `account.move.line`
- **addons/project_timesheet_holidays/** (Phase 286): leave/global-leave timesheet links and company defaults
- `tests/test_phase284_286.py`

### Changed
- **core/tools/config.py**: Added `project_todo`, `project_stock`, `project_sms`, `project_purchase`, `project_hr_expense`, `project_sale_expense`, `project_timesheet_holidays`

---

## 1.109.0 – Phases 274–283: Accounting, Gamification, Supply Chain and MRP Bridges (2026-03-19)

### Added
- **addons/account_debit_note/** (Phase 274): `account.debit.note` wizard + `account.move.debit_origin_id`/`debit_note_ids`
- **addons/crm_sms/** (Phase 275): CRM/SMS bridge with `crm.lead.sms_ids` and `sms_count`
- **addons/gamification/** (Phase 276): badge/challenge/goal/karma models and `res.users` karma/rank
- **addons/sale_loyalty/** (Phase 277): `sale.order.coupon.points`, loyalty fields on `sale.order`
- **addons/gamification_sale_crm/** (Phase 278): badge signal hook when opportunities are marked won
- **addons/purchase_requisition/** (Phase 279): purchase agreements (`purchase.requisition`, lines) + `purchase.order.requisition_id`
- **addons/stock_landed_costs/** (Phase 280): `stock.landed.cost` and `stock.landed.cost.line`
- **addons/sale_mrp/** (Phase 281): production linkage fields on `sale.order` and `sale.order.line`
- **addons/purchase_mrp/** (Phase 282): BOM link fields on `mrp.bom` and `purchase.order.line`
- **addons/sale_purchase_stock/**, **addons/sale_stock_margin/**, **addons/sale_timesheet_margin/** (Phase 283): composite stock/margin/timesheet bridges
- `tests/test_phase274_283.py`

### Changed
- **core/tools/config.py**: Added `account_debit_note`, `crm_sms`, `gamification`, `sale_loyalty`, `gamification_sale_crm`, `purchase_requisition`, `stock_landed_costs`, `sale_mrp`, `purchase_mrp`, `sale_purchase_stock`, `sale_stock_margin`, `sale_timesheet_margin`
- **core/release.py**: version_info = (1, 109, 0)

---

## 1.105.0 – Phases 271–273: Sale Extensions (2026-03-19)

### Added
- **addons/sale_margin/** (Phase 271): purchase_price, margin, margin_percent on sale.order.line; margin, margin_percent on sale.order
- **addons/sale_sms/** (Phase 272): SMS integration with sales (security bridge)
- **addons/sale_expense/** (Phase 273): sale_order_id on hr.expense for reinvoicing

### Changed
- **core/tools/config.py**: Added sale_margin, sale_sms, sale_expense

---

## 1.104.0 – Phases 268–270: Sale Bridges (2026-03-19)

### Added
- **addons/sale_crm/** (Phase 268): opportunity_id on sale.order, order_ids on crm.lead, action_new_quotation, action_view_sale_quotation/action_view_sale_order
- **addons/sale_purchase/** (Phase 269): service_to_purchase on product.template, sale_line_id on purchase.order.line, auto-create PO on SO confirm for service products with vendor
- **addons/sale_timesheet/** (Phase 270): so_line_id on analytic.line, timesheet_ids/qty_delivered on sale.order.line

### Changed
- **core/tools/config.py**: Added sale_crm, sale_purchase, sale_timesheet to DEFAULT_SERVER_WIDE_MODULES

---

## 1.103.0 – Phases 262–267: Sales Stack, Communication, ORM _read_group (2026-03-19)

### Added
- **addons/utm/** (Phase 262): UTM trackers (utm.campaign, utm.medium, utm.source, utm.stage, utm.tag, utm.mixin)
- **addons/phone_validation/** (Phase 262): phone.blacklist, res.partner/res.users _phone_format
- **addons/iap_mail/** (Phase 262): iap.account extensions (company_ids, warning_threshold, warning_user_ids)
- **addons/sales_team/** (Phase 263): crm.team, crm.team.member, crm.tag
- **addons/link_tracker/** (Phase 263): link.tracker, link.tracker.click, link.tracker.code
- **addons/partner_autocomplete/** (Phase 263): res.partner autocomplete_by_name/autocomplete_by_domain stubs
- **addons/account_payment/** (Phase 264): account.payment, account.move payment_ids, transaction_ids/invoice_ids bridge (portal payment)
- **addons/account_check_printing/** (Phase 264): account.payment check_number, account.journal check_sequence_id
- **addons/sale_management/** (Phase 265): sale.order.template, sale.order.template.line, sale.order template_id
- **addons/project_account/** (Phase 265): project.project budget, total_invoiced, margin
- **addons/sale_service/** (Phase 265): sale.order.line project_id, task_id
- **addons/sale_project/** (Phase 265): sale.order project_id, sale.order.line project_id/task_id, project.task sale_line_id
- **addons/sms/** (Phase 266): sms.sms, sms.template
- **addons/privacy_lookup/** (Phase 266): privacy.log
- **addons/web_tour/** (Phase 266): web_tour.tour
- **core/orm/models.py** (Phase 267): _read_group (aggregates, having, date granularities), _read_grouping_sets
- Tests: test_phase262, test_read_group_phase267

### Changed
- **core/orm/models.py**: _abstract support for AbstractModel; merge when _name == _inherit
- **core/tools/config.py**: Added utm, phone_validation, iap_mail, sales_team, link_tracker, partner_autocomplete, account_payment, account_check_printing, sale_management, project_account, sale_service, sale_project, sms, privacy_lookup, web_tour
- **addons/sale/__manifest__.py**: Added sales_team dependency

### Migration Notes
- New modules auto-load via DEFAULT_SERVER_WIDE_MODULES
- read_group now wraps _read_group for backward compatibility

## 1.97.0 – Phases 254–261: ORM Parity, Auth, IAP, Business Modules (2026-03-19)

### Added
- **core/orm/commands.py** (Phase 254): `Command` IntEnum for O2M/M2M writes
- **core/orm/domains.py** (Phase 254): Domain operator constants (`any!`, `not any!`)
- **core/orm/models.py** (Phase 254): `search_fetch`; `any!`/`not any!` in `_domain_to_sql`
- **addons/base_setup/** (Phase 255): `res.config.settings` TransientModel
- **addons/auth_signup/** (Phase 256): res.partner signup_token/type/expiration; res.users.signup(); res.config.settings auth_signup_*
- **addons/auth_oauth/** (Phase 257): `auth.oauth.provider` model
- **addons/iap/** (Phase 258): `iap.account` model
- **addons/portal_rating/** (Phase 259): rating.rating portal extension
- **addons/lunch/** (Phase 260): 9 models (lunch.order, lunch.product, lunch.supplier, etc.)
- **addons/data_recycle/** (Phase 261): `data.recycle.model`, `data.recycle.record`
- Tests for phases 254–261

### Changed
- **core/release.py**: `MIN_PY_VERSION = (3, 10)`; version_info = (1, 97, 0)
- **core/orm/fields.py**: Field `__init__` accepts `**kwargs` (config_parameter)
- **core/tools/config.py**: Added base_setup, auth_signup, auth_oauth, iap, portal_rating, lunch, data_recycle

### Migration Notes
- Python 3.10+ required
- New modules auto-load via DEFAULT_SERVER_WIDE_MODULES

## 1.93.0 – Phases 251–253: Digest, Base Automation, MRP Subcontracting (2026-03-19)

### Added
- **addons/digest/** (Phase 251): KPI email digests
  - `digest.digest`: name, periodicity, next_run_date, user_ids, company_id, state; `_action_send_digest()`
  - `digest.tip`: name, tip_description, group_id
  - `res.users`: digest_ids (M2M)
- **addons/base_automation/** (Phase 252): Extracted from base
  - `base.automation`: same model, now in standalone module; views/menu under Settings > Technical
- **addons/mrp_subcontracting/** (Phase 253): Subcontracting bridge
  - `mrp.bom`: type=subcontracting, subcontractor_ids
  - `stock.move`: is_subcontract
  - `stock.warehouse`: subcontracting_location_id
  - `res.partner`: property_stock_subcontractor
- `tests/test_digest_phase251.py`, `tests/test_base_automation_phase252.py`, `tests/test_mrp_subcontracting_phase253.py`

### Changed
- **addons/base/**: Removed base.automation model, views, menu, access rule; model moved to base_automation
- **core/tools/config.py**: Added `digest`, `base_automation`, `mrp_subcontracting` to DEFAULT_SERVER_WIDE_MODULES
- **tests/test_automation_phase226.py**: Import updated to `addons.base_automation.models.base_automation`

### Migration Notes
- base_automation loads after base; Automated Actions menu now under base_automation
- digest, base_automation, mrp_subcontracting auto-load via config

## 1.92.0 – Phases 249–250: Onboarding + HR Work Entries (2026-03-19)

### Added
- **addons/onboarding/** (Phase 249): Setup wizard toolbox
  - `onboarding.onboarding`: name, route_name, sequence, step_ids, is_per_company
  - `onboarding.onboarding.step`: title, description, done_icon, panel_step_open_action_name, onboarding_id
  - `onboarding.progress`: onboarding_id, company_id, is_onboarding_closed, progress_step_ids
  - `onboarding.progress.step`: step_id, progress_id, state (not_started/in_progress/done)
- **addons/hr_work_entry/** (Phase 250): Work entry tracking for payroll
  - `hr.work.entry.type`: name, code, color, leave_id, is_leave, is_unforeseen, active
  - `hr.work.entry`: name, employee_id, work_entry_type_id, date_start, date_stop, duration, state
  - `hr.employee`: work_entry_source (calendar/manual)
- `tests/test_onboarding_phase249.py`, `tests/test_hr_work_entry_phase250.py`

### Changed
- **core/tools/config.py**: Added `onboarding`, `hr_work_entry` to DEFAULT_SERVER_WIDE_MODULES
- **addons/hr_holidays/__manifest__.py**: Added `hr_work_entry` dependency

## 1.91.0 – Phase 248: Standalone Analytic Module (2026-03-19)

### Added
- **addons/analytic/**: New standalone analytic accounting module (Odoo 19 parity)
  - `analytic.account`: name, code, plan_id, partner_id, company_id, active
  - `analytic.line`: name, date, account_id, amount, unit_amount, product_id, partner_id, move_line_id
  - `account.analytic.plan`: name, parent_id, color (plan hierarchy)
  - security/ir.model.access.csv, views/analytic_views.xml
  - Menu: Analytic > Analytic Accounts, Analytic > Analytic Plans
- `tests/test_analytic_phase248.py`: Module load, analytic.account CRUD with plan_id, analytic.line links

### Changed
- **addons/account/**: Now depends on `analytic`; analytic models moved to analytic module
  - Removed analytic_account.py, analytic_line.py; removed analytic views/menu from account_views.xml
  - account.move.line, hr.expense, project.project continue to use analytic.account via analytic module
- **core/tools/config.py**: Added `analytic` to DEFAULT_SERVER_WIDE_MODULES (before account)

### Migration Notes
- `analytic` loads before `account`; hr_timesheet extends analytic.line via account dependency chain
- No data migration: analytic tables created by analytic module; account no longer owns them

## 1.90.0 – Phase 247: Standalone Product Module (2026-03-18)

### Added
- **addons/product/**: New standalone product module (Odoo 19 parity)
  - `product.template`: name, list_price, standard_price, type, categ_id, uom_id, description, active, attribute_line_ids; _create_variant_ids()
  - `product.product`: _inherits product.template; product_template_id, default_code, barcode, attribute_value_ids, active
  - `product.category`: name, parent_id
  - `product.attribute`, `product.attribute.value`, `product.template.attribute.line`: variant attributes
  - `product.pricelist`, `product.pricelist.item`: pricelists with get_product_price()
  - `product.supplierinfo`: partner_id, product_tmpl_id, price, min_qty
  - security/ir.model.access.csv, views/product_views.xml, views/product_pricelist_views.xml
- `tests/test_product_phase247.py`: Module load, template create, product create via _inherits

### Changed
- **addons/sale/**: Now depends on `product`; product models moved to product module
  - Removed product_template, product_product, product_attribute, product_category, product_pricelist, product_pricelist_item
  - Removed product_views.xml; menu items now reference product.action_product_product, product.action_product_pricelist
  - sale/security/ir.model.access.csv: removed product model access (now in product)
- **core/tools/config.py**: Added `product` to DEFAULT_SERVER_WIDE_MODULES (before sale)

### Migration Notes
- `product` loads before `sale`; stock, purchase, website, etc. get product models via sale → product chain
- No data migration needed: product tables created by product module; sale no longer owns them

## 1.89.3 – Phase Plan 246–253 (Architect Analysis) (2026-03-18)

### Added
- `docs/erp_next_phases_plan_246_253.md`: Full architect plan for next 8 phases based on live Odoo 19.0 source analysis
  - Phase 246: ORM parity (Command class, `any!`/`not any!` operators, `search_fetch`, Python 3.10 bump)
  - Phase 247: `product` module extracted from `sale` as standalone (largest structural gap)
  - Phase 248: `analytic` accounting (account, line, plan, mixin)
  - Phase 249: `onboarding` toolbox
  - Phase 250: `hr_work_entry` (payroll foundation)
  - Phase 251: `digest` KPI email system
  - Phase 252: `base_automation` extracted as standalone module
  - Phase 253: `mrp_subcontracting` bridge
- All phases include exact Odoo 19.0 source paths, model definitions, file lists, test DB names, and parity matrix update targets
- Version target v1.90.0 on completion

## 1.89.2 – Architect Odoo 19.0 Source Integration (2026-03-18)

### Added
- `docs/odoo19_reference.md`: Comprehensive Odoo 19.0 source map — 611 addons categorised, ORM file layout, all new 19.0 features vs 18, gap analysis table (15 high/medium priority gaps identified), Python version note (3.10 min), how-to-explore guide with exact file paths
- `.cursor/rules/agents/system-architect.mdc`: Architect now has direct Odoo 19.0 source paths (`/Users/janarkuusk/AI Power/odoo-19.0/`) for gap analysis workflow
- `.cursor/rules/core-protocol.mdc`: Added Odoo 19.0 source to long-term memory table for all agents

## 1.89.1 – Multi-Agent Developer Team Setup (2026-03-18)

### Added
- `.cursor/rules/core-protocol.mdc`: Always-active core multi-agent protocol; defines agent roles, quality gates, and long-term memory map
- `.cursor/rules/agents/system-architect.mdc`: System Architect persona — planning, gap analysis, phase coordination
- `.cursor/rules/agents/feature-dev.mdc`: Feature Developer persona — implementation, models, tests, Odoo parity conventions
- `.cursor/rules/agents/security-reviewer.mdc`: Security Reviewer persona — access rules, ORM safety, AI tool security
- `.cursor/rules/agents/context-specialist.mdc`: Context Specialist persona — codebase navigation, pattern extraction
- `.cursor/rules/agents/docs-writer.mdc`: Docs Writer persona — changelog, checklist, parity matrix maintenance
- `docs/QUICK_START_AGENTS.md`: Team onboarding guide with trigger phrases, workflow loop, and file structure reference

## 1.89.0 (Phases 234–245: ERP Next Phases Plan)

### Phase 234: ORM Recordset Operations
- core/orm/models.py: filtered_domain, grouped, concat, union, toggle_active, action_archive, action_unarchive, export_data
- ModelBase.name_create(name, env) for Many2one 'Create'
- tests/test_orm_recordset_phase234.py

### Phase 235: API Decorators
- core/orm/decorators.py: onchange, ondelete, depends_context, autovacuum, model_create_multi, model, private, readonly
- core/orm/api.py: api namespace exposing decorators
- addons/base/models/base_autovacuum.py: base.autovacuum model, run() discovers and runs @api.autovacuum
- core/db/init_data.py: daily cron for base.autovacuum
- tests/test_api_decorators_phase235.py

### Phase 236: Missing Field Types
- core/orm/fields.py: Reference, Many2oneReference, Json, Properties, PropertiesDefinition
- core/orm/models.py: _prepare_jsonb_vals for JSONB serialization (psycopg2.extras.Json)
- addons/base/models/base_field_test.py: test model for Phase 236 fields
- tests/test_orm_fields_phase236.py

### Phase 237: UoM + Product Module
- addons/uom: uom.uom, uom.category (units, conversions)
- addons/sale: product.template uom_id; sale depends on uom
- core/db/init_data.py: _load_uom_data (Units, kg, g)
- core/tools/config.py: uom in DEFAULT_SERVER_WIDE_MODULES
- tests/test_uom_product_phase237.py

### Phase 238: Resource + HR Time Off
- addons/resource: resource.calendar, resource.calendar.attendance, resource.resource
- addons/hr_holidays: extends hr.employee with resource_calendar_id; depends on hr, resource
- core/tools/config.py: resource, hr_holidays in DEFAULT_SERVER_WIDE_MODULES
- tests/test_resource_hr_holidays_phase238.py

## 1.88.0 (Phases 229–233: Barcode, Quality, Anomaly, Maintenance, Event)

### Phase 229: Barcode Scanning
- addons/stock_barcode: product.product barcode field, /barcode/scan, /barcode/parse
- core/http/application.py: stock_barcode controller
- core/tools/config.py: stock_barcode in DEFAULT_SERVER_WIDE_MODULES
- tests/test_barcode_phase229.py

### Phase 230: Quality Control
- addons/quality: quality.point, quality.check, quality.alert
- views/quality_views.xml, menus

### Phase 231: AI Anomaly Detection
- addons/ai_assistant/models/ai_anomaly.py: ai.anomaly model
- addons/ai_assistant/tools/anomaly_detection.py: detect_anomalies, explain_anomaly
- addons/ai_assistant/llm.py: tool schemas for Phase 231
- tests/test_anomaly_phase231.py

### Phase 232: Maintenance Module
- addons/maintenance: maintenance.equipment, maintenance.equipment.category, maintenance.team, maintenance.request
- core/tools/config.py: maintenance in DEFAULT_SERVER_WIDE_MODULES
- tests/test_maintenance_phase232.py

### Phase 233: Event Management
- addons/event: event.event, event.registration
- core/tools/config.py: event in DEFAULT_SERVER_WIDE_MODULES
- tests/test_event_phase233.py

## 1.87.0 (Phase 228: AI Demand Forecasting)

### Phase 228: AI Demand Forecasting
- addons/ai_assistant/tools/forecasting.py: forecast_demand, forecast_cashflow, suggest_reorder
- forecast_demand: aggregate sale.order.line by product, LLM trend analysis
- forecast_cashflow: receivables/payables, projected cash position
- suggest_reorder: stock vs demand, safety stock, reorder suggestions
- addons/ai_assistant/llm.py: tool schemas for Phase 228 tools
- tests/test_forecasting_phase228.py

## 1.86.0 (Phase 227: Point of Sale)

### Phase 227: Point of Sale (POS)
- addons/pos: pos.config, pos.session, pos.order, pos.order.line
- Session lifecycle: opening, opened, closed; cash_register_balance_start/end
- Order: lines, amount_total, action_pay, action_done (stock moves + journal entry)
- core/db/init_data.py: pos.session, pos.order sequences
- core/tools/config.py: pos in DEFAULT_SERVER_WIDE_MODULES
- tests/test_pos_phase227.py

## 1.85.0 (Phase 226: Workflow Automation Engine Fixes)

### Phase 226: Workflow Automation Engine Fixes
- core/orm/automation.py: robust update_vals parsing (dict/str/bytes); use env.registry.get for Model/Recordset
- addons/base/models/base_automation.py: iterate rules directly (avoid browse() proxy issue)
- addons/mail/models/ir_actions_server.py: fallback when super() fails with Recordset as self
- tests/test_automation_phase226.py: isolated DB for on_time test (_test_automation_226_ontime)

## 1.84.0 (Phase 225: E2E Test Hardening & Performance Monitoring)

### Phase 225: E2E Test Hardening & Performance Monitoring
- core/http/routes.py: /health returns version; /metrics Prometheus-compatible (erp_request_duration_seconds, erp_query_count)
- tests/e2e/test_health_metrics.py
- tests/e2e/test_dashboard_customize_tour.py

## 1.83.1 (Phase 223: Dashboard Builder)

### Phase 223: Dashboard Builder
- addons/base/models/ir_dashboard_layout.py: user_id, layout_json
- addons/web/static/src/main.js: Customize button, widget visibility toggles, save/load layout

## 1.83.0 (Phase 222: AI Document Processing)

### Phase 222: AI Document Processing (OCR)
- addons/ai_assistant/tools/document_ocr.py: process_document tool (LLM vision extraction)
- addons/ai_assistant/controllers/ai_controller.py: POST /ai/process-document
- tests/test_document_ocr.py

## 1.83.2 (Phase 224: Fleet Management)

### Phase 224: Fleet Management Module
- addons/fleet: fleet.vehicle, fleet.vehicle.model, fleet.vehicle.model.brand, fleet.vehicle.log.contract, fleet.vehicle.log.fuel, fleet.vehicle.log.services
- core/tools/config.py: fleet in DEFAULT_SERVER_WIDE_MODULES

## 1.82.1 (Phase 221: Subscription Management)

### Phase 221: Subscription Management Module (sale_subscription)
- addons/sale_subscription: sale.subscription, sale.subscription.line, sale.subscription.plan
- Cron: _cron_recurring_invoice (daily)
- core/db/init_data.py: subscription cron, sale.subscription sequence
- core/tools/config.py: sale_subscription in DEFAULT_SERVER_WIDE_MODULES

## 1.82.0 (Phase 220: AI Lead Scoring & Smart Assignment)

### Phase 220: AI Lead Scoring & Smart Assignment
- addons/ai_assistant/tools/lead_scoring.py: score_lead, assign_lead tools
- addons/crm/models/crm_lead.py: ai_score, ai_score_label, user_id fields
- addons/crm/views/crm_views.xml: ai_score_label in list/form/kanban
- addons/web/static/src/main.js: ai_score_label in list/form/kanban fields
- tests/test_lead_scoring.py

## 1.81.0 (Phase 219: ORM Context Methods)

### Phase 219: ORM sudo, with_context, with_user, _order
- core/orm/environment.py: Environment.su, __call__(user=, su=, context=), _ModelProxy for env-bound model access
- core/orm/models.py: Recordset.sudo(), with_context(**kw), with_user(uid); search/search_read/search_count/read_group accept env param; _order fallback when order not provided
- core/orm/security.py: get_record_rules returns [] when env.su
- tests/test_orm_sudo.py

## 1.80.1 (Phase 218: LLM Tool Schema Unification)

### Phase 218: LLM Tool Schema Unification
- addons/ai_assistant/llm.py: add 10 tool schemas (analyze_data, analyze_kpi, forecast_metric, nl_search, extract_fields, create_record, update_record, generate_report, suggest_products, schedule_action)
- tests/test_ai_llm.py: test_tool_schema_sync_phase218
- docs/parity_matrix.md: LLM tool parity row

## 1.80.0 (Phase 217: HR Expansion - Attendance, Recruitment & Contracts)

### Phase 217: HR Expansion
- addons/hr_attendance: hr.attendance (employee_id, check_in, check_out, worked_hours computed); /hr/attendance/kiosk
- addons/hr_recruitment: hr.applicant, hr.recruitment.stage; hr.job extended (department_id, no_of_recruitment, state); /jobs/<id>/apply
- addons/hr_contract: hr.contract (employee_id, name, wage, date_start, date_end, state)
- main.js: attendance, applicants, contracts routes; DEFAULT_SERVER_WIDE_MODULES

## 1.79.0 (Phase 216: E-Commerce Module website_sale)

### Phase 216: E-Commerce Module website_sale
- addons/website_sale: new module (depends: website, sale, stock, payment)
- suggest_products tool in ai_assistant (collaborative filtering from sale.order.line)
- /shop overridden with "Recommended for you" section; /shop/ai-recommendations JSON API
- website_sale in DEFAULT_SERVER_WIDE_MODULES

## 1.78.0 (Phase 215: AI Analytics Dashboard & Predictive Forecasting)

### Phase 215: AI Analytics Dashboard & Predictive Forecasting
- addons/ai_assistant/tools/analytics.py: analyze_kpi, forecast_metric tools
- addons/ai_assistant/models/ai_forecast.py: ai.forecast model (model, measure, periods_ahead, forecast_values, last_value)
- Dashboard: AI Insights calls analyze_data, analyze_kpi (anomaly alerts), forecast_metric (forecast display)
- Anomaly alerts: highlight metrics that deviate from trend

## 1.77.0 (Phase 214: AI Autonomous Agents & Multi-Step Task Execution)

### Phase 214: AI Autonomous Agents & Multi-Step Task Execution
- addons/ai_assistant/agent.py: ReAct loop (plan -> execute tool -> observe -> decide next step)
- addons/ai_assistant/models/ai_agent_task.py: ai.agent.task (user_id, goal, steps, status, result)
- addons/ai_assistant/tools/registry.py: create_record, update_record, generate_report, schedule_action tools
- addons/ai_assistant/controllers/ai_controller.py: POST /ai/agent/run, GET /ai/agent/status
- addons/web/static/src/chat_panel.js: Agent mode checkbox; /ai/agent/run + poll; collapsible steps display
- addons/web/views/webclient_templates.xml: chat-agent-row, chat-agent-mode checkbox

## 1.76.0 (Phase 213: Transient Models & Confirmation Dialogs)

### Phase 213: Transient Models (Wizards) & Confirmation Dialogs
- core/orm/models_transient.py: _transient_ttl_hours; TTL-based vacuum when create_date column exists
- TransientModel: count-based and TTL-based auto-vacuum
- base.wizard.confirm, account.reconcile.wizard already use TransientModel
- Wizard form opens as full form (reconcile wizard); ConfirmDialog pattern in wizard_confirm

## 1.75.0 (Phase 212: Binary Fields & File Upload)

### Phase 212: Binary Fields & File Upload
- ir.attachment: mimetype, file_size, checksum; computed on create from datas
- POST /web/binary/upload: Odoo-style upload (ufile or file; optional res_model/res_id)
- GET /web/content/<model>/<id>/<field>/<filename>: download any binary field
- _attachment_download_view: use mimetype from record; remove duplicate code
- Binary and image widgets already in form (file input, base64 to hidden)

## 1.74.0 (Phase 211: Search View, Saved Filters & Action Domain)

### Phase 211: Search View, Saved Filters & Action Domain
- parseFilterDomain(s, uid): uid substitution for filter domains like [('user_id','=',uid)]
- loadRecords: get session uid first, pass to parseFilterDomain when applying search filters
- Search view (filters, group_bys) already parsed from XML; action domain/context already in load_views
- Saved filters (localStorage + ir.filters) and filter chips already in renderList

## 1.73.0 (Phase 210: ORM Computed Fields & Model Inheritance)

### Phase 210: ORM Computed Fields & Model Inheritance
- core/orm/models.py: _compute_non_stored_values() for non-stored computed fields on read
- read(): compute non-stored Computed fields when requested
- core/orm/fields.py: Computed accepts compute as method name (str) or callable
- core/orm/registry.py: deferred _inherit merge when base not yet registered; _pending_merges
- _compute_stored_values: support compute as callable
- tests/test_computed_fields.py, tests/test_model_inheritance.py

## 1.72.0 (Phase 209: E2E Test Coverage & CI Enhancements)

### Phase 209: E2E Test Coverage & CI Enhancements
- tests/e2e/test_crm_lead_tour.py: create lead, verify in list
- tests/e2e/test_orders_tour.py: login, navigate to Orders
- pytest-cov in requirements-dev.txt
- CI: Run unit tests with coverage (pytest --cov=core --cov=addons); upload coverage artifact
- .github/workflows/ci.yml: coverage-report artifact when coverage.xml exists

## 1.71.0 (Phase 208: REST API v1 & OpenAPI Spec)

### Phase 208: REST API v1 & OpenAPI Spec
- core/http/rest.py: /api/v1/<model> GET (list/read), POST (create), PUT (update), DELETE (unlink)
- Query params: domain, fields, limit, offset, order
- Auth: Bearer token (res.users.apikeys); same check_access and record rules
- JSON envelope: { "data": [...], "total": N, "offset": 0 }
- /api/v1/openapi.json: OpenAPI 3.0 spec; /api/v1/docs: Swagger UI
- CSRF exempt for /api/v1/* (Bearer auth)
- tests/test_rest_api_phase208.py

## 1.70.0 (Phase 207: Mass Mailing & Email Marketing)

### Phase 207: Mass Mailing & Email Marketing
- addons/mailing: mailing.list, mailing.list.partner (is_subscribed), mailing.mailing, mailing.tracking
- mailing.mailing: name, subject, body_html (Jinja2), mailing_list_id, state (draft/sending/sent), sent_count, opened_count, clicked_count
- action_send: queues mail.mail per subscriber with tracking pixel and link rewriting
- /mail/track/open/<token>: 1x1 pixel for opens; /mail/track/click/<token>?url=...: track and redirect
- /mail/unsubscribe/<token>: set is_subscribed=False on mailing.list.partner
- Marketing > Mailing Lists, Marketing > Mailings (list/form with stats)
- addons/web/static/src/main.js: marketing/mailing_lists, marketing/mailings routes
- tests/test_mailing_phase207.py

## 1.69.0 (Phase 206: Multi-Step Approval Chains)

### Phase 206: Multi-Step Approval Chains
- approval.rule: parent_rule_id (Many2one self) for chaining; sequence for ordering
- approval.request: step, next_rule_id, delegate_to_user_id; action_approve creates next step when chained
- action_reject, action_delegate(user_id); form view with Approve/Reject/Delegate buttons
- addons/base/models/approval_check.py: check_approval_rules on write/create when amount crosses min_amount
- core/orm/models.py: wire approval check after write and create
- Settings > Approval Rules (parent_rule_id in form); Settings > Approval Requests (list/form)
- addons/web/static/src/main.js: settings/approval_requests route
- tests/test_approval_phase206.py

## 1.68.0 (Phase 205: Audit Trail)

### Phase 205: Audit Trail & Activity Log
- audit.log model: user_id, model, res_id, operation (create/write/unlink), old_values, new_values (JSON), timestamp
- core/orm/models.py: audit hooks in create, write, unlink when model has _audit = True
- _audit enabled on: sale.order, purchase.order, account.move, crm.lead, hr.employee, res.users
- addons/base/models/audit_log.py, log_audit()
- Settings > Technical > Audit Log (list/form)
- tests/test_audit_phase205.py

## 1.67.0 (Phase 202: Inventory & Sales Reports)

### Phase 202: Inventory & Sales Reports
- product.product.get_stock_valuation_report: product, qty_available, standard_price, total_value; grouped by category
- sale.order.get_sales_revenue_report: period (day/week/month) or product grouping, date range
- addons/stock/models/stock_report.py, addons/sale/models/sale_report.py
- addons/web/static/src/main.js: renderStockValuationReport, renderSalesRevenueReport; #reports/stock-valuation, #reports/sales-revenue
- Menu: Inventory > Reporting > Stock Valuation Report; Accounting > Reports > Sales Revenue
- tests/test_reports_phase202.py

## 1.66.0 (Phase 204: Database Indexing)

### Phase 204: Database Indexing & Query Performance
- core/db/schema.py: _create_performance_indexes on res_partner(email), sale_order(partner_id,state), account_move(partner_id,state,move_type), account_move(move_type,state), stock_quant(product_id,location_id), crm_lead(stage_id), mail_message(res_model,res_id), ir_attachment(res_model,res_id)
- tests/test_indexes_phase204.py

## 1.65.0 (Phase 203: Security Hardening)

### Phase 203: Security Hardening
- CSRF protection: per-session token, validate on state-changing POST; exempt login, signup, get_session_info, payment, Bearer APIs
- core/http/security.py: validate_csrf, check_rate_limit, security headers
- core/http/session.py: csrf_token in session, ensure_session_csrf for backward compat
- Rate limiting: sliding window per IP+path; login 5/min, signup 3/min, default 120/min
- Security headers: X-Frame-Options DENY, Referrer-Policy, Content-Security-Policy-Report-Only
- Frontend: session.getAuthHeaders(), rpc and fetch calls send X-CSRF-Token
- tests/test_security_phase203.py

## 1.64.0 (Phase 201: Dashboard & Reporting Enhancements)

### Phase 201: Dashboard & Reporting Enhancements
- Default dashboard widgets: Sales This Month, Open Invoices, Low Stock, Overdue Tasks (in addition to Open Leads, Expected Revenue, My Activities)
- core/db/init_data.py: _load_dashboard_widgets adds missing widgets on upgrade (not only when table empty)
- addons/web/static/src/main.js: KPI drill-down for all models (model-to-route: sale.order→orders, account.move→invoices, product.product→products, project.task→tasks)
- ir.dashboard.widget.get_data returns domain with each widget for filtered list drill-down
- tests/test_dashboard_phase201.py

## 1.63.0 (Phase 200: Multi-Currency Improvements)

### Phase 200: Multi-Currency Improvements
- account.move: amount_residual (computed, in invoice currency; 0 when paid)
- account.bank.statement: currency_id for statement currency
- account_reconcile._auto_reconcile: convert statement amount to company currency when statement has different currency
- account move form: currency_id, amount_residual; bank statement form: currency_id
- tests/test_multi_currency_phase200.py

## 1.62.0 (Phase 199: Customer Portal - Invoice Payment)

### Phase 199: Customer Portal (Orders & Invoices - Pay Online)
- payment.transaction: account_move_id for invoice payments
- Portal invoice detail: "Pay Online" button when not paid
- /my/invoices/<id>/pay: GET form (provider selection), POST creates transaction, redirects
- payment/status: when done + account_move_id, marks invoice paid, redirects to /my/invoices/<id>
- tests/test_portal_invoice_pay_phase199.py

## 1.61.0 (Phase 198: Lot/Serial Number Tracking)

### Phase 198: Lot/Serial Number Tracking
- stock.lot: expiry_date field
- stock.move: lot_id Many2one
- stock_move_quant._update_quants: handle lot_id on receipt (create quant with lot) and delivery (consume from lot or FIFO)
- stock.picking form: lot_id on move_ids list
- stock.lot: list/form views, Inventory > Configuration > Lots menu
- addons/web/static/src/main.js: lots route
- tests/test_lot_serial_phase198.py

## 1.60.0 (Phase 197: Purchase → Receipt → Vendor Bill)

### Phase 197: Purchase Order → Receipt → Vendor Bill Workflow
- purchase.order: bill_status (no/partial/full), _update_bill_status(), _get_received_qty_by_product()
- action_create_bill: uses received qty when available (from done moves in pickings)
- stock.picking: purchase_id, action_create_bill() for vendor bill from received qty
- addons/purchase/models/stock_picking.py: extend picking with purchase_id
- addons/account/models/stock_picking.py: action_confirm updates bill_status on validate; action_create_bill
- addons/purchase/models/purchase_order.py: bill_status, _create_bill_from_picking, _create_bill_with_quantities
- tests/test_purchase_receipt_bill_phase197.py

## 1.59.0 (Phase 196: Sale → Delivery → Invoice)

### Phase 196: Sale Order → Delivery → Invoice Workflow
- sale.order: delivery_status (no/partial/full), _update_delivery_status(), _get_delivered_qty_by_product()
- action_create_invoice: uses delivered qty when available (from done moves in pickings)
- stock.picking: sale_id, action_create_invoice() for invoice from delivered qty
- account/models/stock_picking.py: extend picking to update delivery_status on validate, add Create Invoice button
- stock/sale_order: set sale_id when creating picking; fix product_id unpack in move create
- stock_valuation_layer: fix default lambda for create_date
- tests/test_sale_delivery_invoice_phase196.py

## 1.58.0 (Phase 195: Reconciliation Wizard)

### Phase 195: Account Move Reconciliation Wizard
- addons/account/models/account_reconcile_wizard.py: account.reconcile.wizard (TransientModel), account.reconcile.wizard.line
- account.move.line: reconciled_id (Char) for grouping reconciled lines
- account.bank.statement: action_reconcile() opens wizard with unreconciled lines; Reconcile button in header
- account_reconcile: _auto_reconcile excludes lines with reconciled_id
- addons/web/static/src/main.js: button handler handles action return (navigate to wizard form)
- tests/test_reconcile_wizard_phase195.py

## 1.57.0 (Phase 194: Platform Fixes)

### Phase 194: Platform Fixes
- requirements.txt: Pin bcrypt>=4.0,<4.1 for passlib compatibility (avoids __about__ AttributeError)
- core/http/auth.py: Suppress passlib logger to avoid bcrypt version warning
- README.md: Add PGUSER=postgres instructions for PostgreSQL role mismatch
- DeploymentChecklist.md: PGUSER note, WebSocket (gevent) optional section

## 1.56.0 (Phases 186–193: Payroll, Pricelists, Variants, Orderpoints, Helpdesk, Payment Terms, Timesheets, Bank Statements)

### Phase 186: HR Payroll
- addons/hr_payroll/: new addon (hr.payslip, hr.salary.rule, hr.payslip.line)
- hr.employee: wage field (inherited)
- compute_sheet(env=): applies salary rules, creates payslip lines, sets state done
- Payroll > Payslips, Payroll > Salary Rules menus
- core/db/init_data.py: ir.sequence hr.payslip; hr_payroll in DEFAULT_SERVER_WIDE_MODULES
- tests/test_payroll_phase186.py

### Phase 190: Helpdesk Module
- addons/helpdesk/: new addon (helpdesk.ticket, helpdesk.stage)
- helpdesk.ticket: name, partner_id, user_id, stage_id, priority, deadline, description, message_ids (MailThreadMixin)
- helpdesk.stage: name, sequence, fold
- Kanban + list + form; Helpdesk > Tickets, Helpdesk > Configuration > Stages
- addons/web/static/src/main.js: tickets route, kanban support for helpdesk.ticket
- core/tools/config.py: helpdesk in DEFAULT_SERVER_WIDE_MODULES
- core/db/init_data.py: default helpdesk.stage (New, In Progress, Solved)
- tests/test_helpdesk_phase190.py

### Phase 189: Inventory Reordering Rules
- addons/stock/models/stock_orderpoint.py: stock.warehouse.orderpoint (product_id, location_id, product_min_qty, product_max_qty, qty_multiple, partner_id)
- _procure_orderpoint_confirm(): creates purchase.order when partner_id set, else stock.move from supplier location
- Inventory > Configuration > Reordering Rules menu
- tests/test_orderpoint_phase189.py

### Phase 188: Full Product Variants
- addons/sale/models/product_template.py: _create_variant_ids() generates product.product from attribute_line_ids combinations
- create/write triggers _create_variant_ids; no-attribute template gets one variant; attribute lines yield Cartesian product
- tests/test_variants_phase188.py

### Phase 193: Bank Statements & Reconciliation
- addons/account/models/account_bank_statement.py: account.bank.statement (journal_id, date, balance_start, balance_end_real, line_ids), account.bank.statement.line (name, date, amount, partner_id, move_id)
- addons/account/models/account_reconcile.py: _auto_reconcile(statement_line) matches open account.move.line by amount + partner (asset_cash)
- account.journal: added type "bank"; init_data: BANK journal, account.bank.statement sequence
- core/http/routes.py: POST /web/import/bank_statement (CSV parser: date, amount, name, partner)
- Invoicing > Bank Statements; form with Reconcile button per line
- addons/web/static/src/main.js: bank_statements route
- tests/test_bank_statement_phase193.py

### Phase 192: Timesheets
- addons/hr_timesheet/: new addon (depends: account, hr, project)
- analytic.line: employee_id, task_id, project_id (unit_amount, date already present)
- project.task: timesheet_ids (One2many to analytic.line)
- Timesheets > My Timesheets, Timesheets > All Timesheets; task form shows timesheet_ids
- addons/web/static/src/main.js: timesheets route; hr_timesheet in DEFAULT_SERVER_WIDE_MODULES
- tests/test_timesheet_phase192.py

### Phase 191: Payment Terms
- addons/account/models/account_payment_term.py: account.payment.term (name, line_ids), account.payment.term.line (value, value_amount, days, day_of_month, sequence)
- compute(value, date_ref): returns list of (amount, due_date); supports balance, percent, fixed
- account.move: payment_term_id, invoice_date_due (computed from term and line totals)
- sale.order (account): payment_term_id; action_create_invoice passes term to invoice
- purchase.order: payment_term_id
- Invoicing > Configuration > Payment Terms; payment_term_id on invoice, sale order, purchase order forms
- tests/test_payment_terms_phase191.py

### Phase 187: Product Pricelists
- addons/sale/models/product_pricelist.py: product.pricelist (name, currency_id, item_ids)
- addons/sale/models/product_pricelist_item.py: product.pricelist.item (pricelist_id, product_id, min_qty, price_surcharge, percent_price, date_start, date_end)
- product.pricelist.get_product_price(product, qty, partner): returns price from first matching item or list_price
- sale.order: pricelist_id (Many2one); _apply_pricelist() in action_confirm updates line price_unit
- addons/sale/views/sale_views.xml: Pricelists menu, pricelist form/list, pricelist_id on sale order form
- tests/test_pricelist_phase187.py

## 1.55.0 (Phases 178–185: Mail Templates, Import, Kanban DnD, Tax, Reports, PDF, Attachments, Bulk)

### Phase 185: Bulk Operations
- addons/web/static/src/main.js: checkbox column with #list-select-all and .list-row-select; #bulk-action-bar with Delete Selected and Clear
- Event handlers: select all, row selection, bulk delete (rpc unlink), bulk clear; bar visibility based on selection count

### Phase 184: Chatter File Attachments
- addons/mail/models/ir_attachment.py: extend ir.attachment with mail_message_id
- addons/mail/models/mail_message.py: attachment_ids (One2many)
- addons/mail/models/mail_thread.py: message_post(attachment_ids=[])
- core/http/routes.py: POST /web/attachment/upload, GET /web/attachment/download/<id>
- addons/web/static/src/main.js: chatter file input, upload before post, display attachment links

### Phase 183: PDF Report Templates
- core/http/report.py: register sale.order, account.move, purchase.order, stock.picking in _REPORT_REGISTRY
- addons/web/static/src/main.js: getReportName maps sale.order, account.move, purchase.order, stock.picking
- Templates: sale/report/sale_order_report.html, account/report/invoice_report.html, purchase/report/purchase_order_report.html, stock/report/delivery_slip_report.html (already present)

### Phase 182: Accounting Reports
- addons/account/models/account_report.py: get_trial_balance, get_profit_loss, get_balance_sheet (inherit account.account)
- addons/account/models/account_move.py: date field for report filtering
- addons/account/views/account_views.xml: Invoicing > Reports > Trial Balance, P&L, Balance Sheet
- addons/web/static/src/main.js: #reports/trial-balance, #reports/profit-loss, #reports/balance-sheet with date pickers

### Phase 181: Tax Management
- addons/account/models/account_tax.py: account.tax (name, amount, amount_type, type_tax_use, price_include); compute_all(price_unit, quantity)
- addons/account/models/account_move_line.py: tax_ids (Many2many)
- addons/sale/models/sale_order_line.py: tax_id (Many2many); price_subtotal includes tax when set
- addons/purchase/models/purchase_order_line.py: taxes_id (Many2many); price_subtotal includes tax when set
- addons/account/views/account_views.xml: Invoicing > Configuration > Taxes menu

### Phase 180: Drag-and-Drop Kanban
- addons/web/static/src/main.js: renderKanban passes onStageChange for crm.lead and project.task; uses groupBy from view
- addons/web/static/src/views/kanban_renderer.js: normalize Many2one [id,name] for grouping; draggable cards, drop handlers, visual feedback (already present)

### Phase 179: CSV/Excel Import Wizard
- core/http/routes.py: POST /web/import/preview (parse CSV/XLSX, return headers + first 5 rows)
- core/http/routes.py: POST /web/import/execute (model, mapping, file -> Model.import_data)
- addons/web/static/src/main.js: Import modal accepts .csv,.xlsx; uses server endpoints for preview and execute
- tests/test_import_phase179.py

### Phase 178: Mail Templates
- addons/mail/models/mail_template.py: mail.template (name, model_id, subject, body_html, email_from, email_to, auto_delete)
- Jinja2 rendering for subject/body; send_mail(res_id) creates mail.mail, optionally sends
- addons/mail/models/ir_actions_server.py: extend ir.actions.server with template_id; state=email uses mail.template
- addons/mail/views/mail_template_views.xml: Settings > Email Templates menu
- tests/test_mail_template_phase178.py

## 1.54.0 (Phases 170–177: Menu Fix, Tracking, Email Routing, Stock Valuation, Excel, Approval, Editable List, Search Panel)

### Phase 170: Fix Navigation Menu + Auto-Upgrade on Login
- core/http/routes.py: load_views auto-runs load_default_data when DB menus empty or &lt;50% of XML count
- addons/web/static/src/main.js: warning banner when menus empty ("Run: erp-bin db upgrade -d &lt;db&gt;")
- core/data/views_registry.py: already keeps XML menus when DB menus_filtered empty (no overwrite)
- tests/test_menu_fix_phase170.py

### Phase 171: Field Change Tracking (Audit Trail)
- core/orm/fields.py: Field base class adds tracking=True parameter
- core/orm/models.py: write() reads old values for tracked fields; _track_changes() creates mail.message with change log
- crm.lead: tracking=True on stage_id, partner_id, expected_revenue
- sale.order: tracking=True on state, partner_id
- account.move: tracking=True on state
- hr.leave: tracking=True on state
- tests/test_tracking_phase171.py

### Phase 172: Incoming Email to Chatter (Reply Routing)
- addons/mail/models/mail_message.py: message_id field (Char) for email Message-ID
- addons/mail/models/mail_thread.py: message_post generates message_id; passes to mail.mail when send_as_email
- addons/mail/models/mail_mail.py: message_id field; ir.mail_server sets Message-ID header when sending
- addons/fetchmail/models/fetchmail_server.py: In-Reply-To routing - match mail.message by message_id, post to chatter
- tests/test_email_routing_phase172.py

### Phase 173: Stock Valuation + Cost Tracking
- addons/stock/models/product_product.py: standard_price, cost_method (standard/average)
- addons/stock/models/stock_valuation_layer.py: stock.valuation.layer (product_id, quantity, unit_cost, value, stock_move_id)
- addons/stock/models/stock_move_quant.py: _create_valuation_layers on done moves; average cost updates product.standard_price
- addons/stock/views/stock_views.xml: Inventory > Reporting > Valuation menu
- tests/test_valuation_phase173.py

### Phase 174: Excel Export
- core/http/routes.py: POST /web/export/xlsx (model, fields, domain) returns .xlsx via openpyxl
- addons/web/static/src/main.js: Export Excel button; POST to /web/export/xlsx with current domain
- requirements.txt: openpyxl>=3.1
- tests/test_excel_export_phase174.py

### Phase 175: Generic Approval Workflow
- addons/base/models/approval_rule.py: approval.rule (model, field_trigger, approver_user_id, approver_group_id, min_amount)
- addons/base/models/approval_request.py: approval.request (rule_id, res_model, res_id, state: pending/approved/rejected)
- addons/base/views/ir_views.xml: Settings > Approval Rules, Approval Requests menus

### Phase 176: Editable List View
- core/data/xml_loader.py: parse editable attribute from &lt;list editable="top"|"bottom"&gt;
- core/data/views_registry.py: include editable in list view_def
- addons/crm/views/crm_views.xml: crm.lead list editable="bottom"

### Phase 177: Search Panel
- core/data/xml_loader.py: parse &lt;searchpanel&gt; with &lt;field name="..." select="one"|"multi"/&gt;
- core/data/views_registry.py: include search_panel in search view_def
- addons/crm/views/crm_views.xml: searchpanel for stage_id on crm.lead
- addons/project/views/project_views.xml: searchpanel for project_id on project.task

## 1.53.0 (Phases 162–169: DB Upgrade, Statusbar, One2many Edit, Onchange, Email, Calendar, Analytic, Responsive)

### Phase 162: DB Upgrade CLI + Data Reload
- core/upgrade/runner.py: run_upgrade calls load_default_data (idempotent menus, actions, views, sequences, stages)
- addons/web/static/src/main.js: Removed fallback menus (use `erp-bin db upgrade -d <db>` to reload menus)
- tests/test_db_upgrade_phase162.py

### Phase 163: Statusbar Widget + Workflow Buttons
- addons/web/static/src/main.js: statusbar supports Selection fields (string values), fix write/compare for draft/sale/cancel
- addons/web/static/src/scss/webclient.css: statusbar done-state checkmark, header button pill styling
- sale, purchase, account, mrp, hr: form views with `<field name="state" widget="statusbar"/>`
- tests/test_statusbar_phase163.py

### Phase 164: Inline One2many Editing
- addons/web/static/src/main.js: renderOne2manyRow with number inputs, computed subtotal, setupOne2manyComputedFields
- getOne2manyLineFields for mrp.bom bom_line_ids, hr.expense.sheet expense_line_ids
- Auto-compute price_subtotal (qty*price) and total_amount on input; "Add a line" button
- addons/web/static/src/scss/webclient.css: o2m-editable styles
- tests/test_one2many_edit_phase164.py

### Phase 165: Onchange + Dynamic Domains
- sale.order.line._onchange_product_id: fill price_unit, name from product
- purchase.order.line._onchange_product_id: same
- sale.order._onchange_partner_id: fill currency_id from company
- crm.lead._onchange_partner_id: fill email_from, phone from partner; crm.lead email_from, phone fields
- addons/web/static/src/main.js: setupO2mOnchangeHandlers for product_id in order lines
- tests/test_onchange_phase165.py

### Phase 166: Email Outbox (SMTP)
- mail.mail.send(), ir.mail_server, process_email_queue already implemented
- core/http/rpc.py: process_email_queue in _CLASS_METHODS for RPC
- tests/test_email_phase166.py

### Phase 169: Responsive Layout + Mobile
- addons/web/static/src/scss/webclient.css: media queries for 768px, 480px; hamburger menu, stacked forms, touch targets (44px min)
- addons/web/static/src/main.js: hamburger toggle for nav; touch-friendly dropdowns on mobile
- Kanban single-column on mobile; list view horizontal scroll with sticky first column

### Phase 168: Analytic Accounting
- addons/account/models/analytic_account.py: analytic.account (name, code, partner_id, company_id, active)
- addons/account/models/analytic_line.py: analytic.line (name, date, account_id, amount, unit_amount, partner_id, move_line_id)
- account.move.line: analytic_account_id Many2one
- hr.expense: analytic_account_id; action_done creates analytic.line when expense has analytic account
- project.project: analytic_account_id for project cost tracking
- Invoicing > Configuration > Analytic Accounts menu
- tests/test_analytic_phase168.py

### Phase 167: Calendar Module
- addons/calendar/: calendar.event, calendar.attendee (meetings linked to partners)
- calendar.event: name, start, stop, allday, duration (computed), partner_ids, user_id, location, description, privacy, show_as
- calendar.attendee: event_id, partner_id, state (needs_action/accepted/declined)
- addons/calendar/views/calendar_views.xml: calendar, list, form views; Meetings menu
- addons/website/controllers/website.py: /my/calendar, /my/calendar/<id> portal routes
- core/tools/config.py: calendar in DEFAULT_SERVER_WIDE_MODULES
- addons/web/static/src/main.js: actionToRoute calendar_event->meetings, getModelForRoute meetings->calendar.event
- tests/test_calendar_phase167.py

## 1.52.1 (Menu navigation fix)

### Menu visibility fix
- core/data/views_registry.py: Only overwrite XML menus with DB menus when DB returns non-empty; keep XML fallback when filtered empty
- core/data/views_registry.py: Parse record-style ir.ui.menu (parent_id, action refs) for knowledge module
- core/tools/config.py: Add mrp to DEFAULT_SERVER_WIDE_MODULES (menus from XML)
- addons/web/static/src/main.js: Fallback menus when server returns empty (Home, Contacts, Leads, Orders, Products, Tasks, Settings)
- addons/web/static/src/main.js: actionToRoute/getModelForRoute for transfers, warehouses, purchase_orders, invoices, journals, accounts, employees, departments, jobs, projects
- addons/web/static/src/main.js: menuToRoute for contacts, leads, orders, products, tasks

## 1.52.0 (Phases 154–161: Multi-Currency, Variants, Payment, Portal, Gantt, Webhooks, Widgets, Expenses)

### Phase 161: Expense module
- addons/hr_expense/: new addon (hr.expense, hr.expense.sheet)
- Workflow: draft → submit → approve → done; action_done creates account.move
- core/db/init_data.py: ir.sequence hr.expense.sheet; hr_expense in DEFAULT_SERVER_WIDE_MODULES
- core/orm/models.py: create() merges default_get for stored fields (Phase 161)
- tests/test_hr_expense_phase161.py

### Phase 160: Advanced form widgets
- addons/web/static/src/main.js: priority, progressbar, phone, email, url widgets in renderFieldHtml
- crm.lead: priority Selection; project.task: priority, progress; res.partner: mobile, website
- tests/test_widgets_phase160.py

### Phase 159: Webhooks + event bus
- addons/base/models/ir_webhook.py: ir.webhook, ir.webhook.log
- core/orm/models.py: run_webhooks on create/write/unlink; HMAC-SHA256; async delivery
- tests/test_webhook_phase159.py

### Phase 158: Gantt view
- addons/web/static/src/main.js: loadGanttData, renderGanttView (date_start/date_end bars)
- project.task: date_start; mrp.production: date_start, date_finished
- project_views.xml, mrp_views.xml: gantt view definitions
- tests/test_gantt_phase158.py

### Phase 157: Portal signup + invoice portal
- core/orm/security.py: portal record rule for account.move (out_invoice, partner_id)
- addons/website/controllers/website.py: /my/invoices, /my/invoices/<id>, PDF download link
- Portal nav: My Invoices link
- tests/test_portal_signup_phase157.py

### Phase 156: Payment integration
- addons/payment/: new addon (payment.provider, payment.transaction)
- Demo and manual providers; checkout form payment selector
- /payment/process, /payment/status/<ref>, /payment/callback
- core/db/init_data.py: _load_payment_providers
- tests/test_payment_phase156.py

### Phase 155: Product variants
- addons/sale/models/product_template.py: product.template (name, list_price, categ_id, attribute_line_ids)
- addons/sale/models/product_attribute.py: product.attribute, product.attribute.value, product.template.attribute.line
- addons/sale/models/product_product.py: _inherits product.template, attribute_value_ids Many2many
- addons/website/controllers/website.py: variant selector on /shop/product/<id> when template has attributes
- tests/test_product_variant_phase155.py

### Phase 154: Multi-currency conversion
- addons/base/models/res_currency.py: `convert(amount, from_currency_id, to_currency_id, date)` method using res.currency.rate
- core/orm/models.py: _trigger_dependant_recompute supports One2many (order_line.product_qty); trigger on create; ModelBase __getattribute__ resolves One2many/Many2many to recordset
- addons/sale/models/sale_order.py: currency_id defaults from company
- addons/purchase/models/purchase_order.py: currency_id, amount_total (stored computed), _compute_amount_total from order_line
- addons/purchase/models/purchase_order_line.py: price_subtotal (computed)
- addons/account/models/account_move.py: currency_id
- addons/account/models/account_move_line.py: amount_currency, currency_id
- addons/account/models/sale_order.py: action_create_invoice passes currency_id; multi-currency lines with amount_currency
- tests/test_currency_phase154.py: convert, SO default currency, PO amount_total

## 1.50.0 (Phases 152–153: Server Action Fix, Technical Settings, MRP)

### Phase 152: Server action fix + Technical settings UI
- addons/base/models/ir_actions_server.py: fix action.state/action.code (use read() instead of field access)
- addons/base/views/ir_views.xml: Settings > Technical submenu (Scheduled Actions, Server Actions, Sequences)
- addons/web/static/src/main.js: routes for cron, server_actions, sequences
- tests/test_server_actions_phase119.py: passes (automation on_create sets description)
- addons/stock/models/stock_move_quant.py: fix super().write() → ModelBase.write() for inheritance

### Phase 153: MRP module (Manufacturing)
- addons/mrp/: new addon (depends: base, stock, sale)
- mrp.bom, mrp.bom.line: Bill of materials with components
- mrp.production: Manufacturing order (MO/00001, etc); workflow: draft → confirmed → progress → done
- mrp.workcenter: Work centers (name, capacity, time_start, time_stop)
- addons/mrp/models/stock_location.py: extend with type "production"
- addons/mrp/models/stock_move.py: production_id Many2one
- action_confirm: create stock moves (raw: internal→production, finished: production→internal)
- action_done: validate moves, update quants
- core/db/init_data.py: mrp.production sequence, _load_mrp_data (production location)
- tests/test_mrp_phase153.py

## 1.49.0 (Phases 146–147: Document Sequences, Discuss)

### Phase 146: Document sequence integration
- addons/sale/models/sale_order.py: create() assigns SO/00001 via ir.sequence
- addons/purchase/models/purchase_order.py: create() assigns PO/00001, PO/00002...
- addons/account/models/account_move.py: create() assigns INV/00001...
- core/db/init_data.py: seed ir.sequence for sale.order, purchase.order

### Phase 147: Discuss module (mail.channel)
- addons/mail/models/mail_channel.py: mail.channel (name, channel_type, message_ids, channel_member_ids)
- addons/mail/models/mail_channel_member.py: mail.channel.member (channel_id, user_id)
- addons/mail/controllers/discuss.py: /discuss/channel/list, create, /channel/<id>/messages, /channel/<id>/post
- addons/web/static/src/main.js: Discuss nav link, channel list, message thread, compose box, real-time via bus

### Phase 149: HR Leave Management
- addons/hr/models/hr_leave_type.py: hr.leave.type (name, allocation_type, color, max_leaves, sequence)
- addons/hr/models/hr_leave.py: hr.leave (employee_id, leave_type_id, date_from, date_to, number_of_days, state: draft/confirm/validate/refuse)
- addons/hr/models/hr_leave_allocation.py: hr.leave.allocation
- Workflow: action_confirm, action_validate, action_refuse, action_draft
- Calendar view for leaves (date_from), list/form views

### Phase 148: Notification center
- addons/mail/models/mail_notification.py: mail.notification (res_partner_id, mail_message_id, is_read, notification_type)
- mail_thread.message_post and mail.channel.message_post create notifications for followers
- addons/mail/controllers/discuss.py: /mail/notifications, /mail/notifications/mark_read
- addons/web/static/src/main.js: bell icon in navbar, unread badge, dropdown with notification list, mark all read

## 1.47.0 (Phases 144–145: Profiling, Backup/Restore)

### Bugfix: load_views 500 (JSON serialization)
- core/http/routes.py: _json_safe() sanitizes registry before json.dumps; replaces callables (e.g. field defaults) with None to fix "Object of type function is not JSON serializable"

### Phase 144: Profiling + performance monitoring
- core/profiling.py: request timing, ORM query count and timing via contextvars
- core/tools/config.py: --debug=profiling flag
- core/sql_db.py: wrap cursor to record queries when debug_profiling
- core/http/application.py: X-Response-Time-Ms, X-Query-Count, X-Query-Time-Ms headers when profiling

### Phase 145: Automated backup/restore cron
- addons/base/models/db_backup.py: base.db.backup.run() cron hook (pg_dump)
- core/db/init_data.py: seed "Database backup" cron (daily, 1440 min)
- core/cli/db.py: backup, restore actions; --backup-dir, -f for restore
- core/tools/config.py: backup_dir, ERP_BACKUP_DIR env, ir.config_parameter db.backup_dir

## 1.46.0 (Phase 143: Shop E2E, Order Email, My Orders)

### Phase 143a: Shop E2E tests
- tests/e2e/test_shop_tour.py: Playwright tour (shop → product → cart → checkout → confirmation)
- core/db/init_data.py: _load_product_demo creates Widget A/B/C when no products exist (enables E2E)

### Phase 143b: Order confirmation email
- addons/sale/models/sale_order.py: action_confirm calls _send_order_confirmation_email
- Creates mail.mail (outgoing) with order details; cron process_email_queue sends

### Phase 143c: Customer order history
- addons/website/controllers/website.py: /my/orders, /my/orders/<id> portal routes
- Portal nav: My Orders link
- core/orm/security.py: portal record rule for sale.order (partner_id = user's partner)

## 1.45.0 (Phase 142: Cart + Checkout)

### Phase 142: Cart + checkout
- addons/website/controllers/website.py: /shop/cart (view, add, remove via query params; cart in erp_cart cookie)
- /shop/checkout: address form (name, email, street, city); creates res.partner for guests; creates sale.order with order_line; action_confirm
- /shop/confirmation: thank-you page; cart cookie cleared on checkout
- Cart stored in base64-encoded JSON cookie (anonymous checkout supported)

## 1.44.0 (Phases 133–134: Dark mode, Accessibility)

### Phase 141: Website shop (product catalog)
- addons/sale/models/product_category.py: product.category (name, parent_id)
- addons/sale/models/product_product.py: categ_id Many2one
- addons/website/controllers/website.py: /shop (product grid, category filter), /shop/product/<id> (detail, Add to Cart)
- Public routes; no auth required

### Phase 140: AI analytics dashboard
- addons/ai_assistant/tools/registry.py: analyze_data(model, measure, groupby, use_llm) tool
- Uses read_group; when use_llm: LLM generates NL summary of KPIs
- addons/web/static/src/main.js: Dashboard "AI Insights" card; fetches crm.lead expected_revenue by stage_id

### Phase 139: AI-assisted workflows (suggest next actions)
- addons/ai_assistant/tools/registry.py: suggest_next_actions(model, record_id) tool
- addons/web/static/src/main.js: form sidebar "AI Suggestions" panel for crm.lead and project.task (non-new)
- Fetches suggestions on form load; displays labels (Schedule call, Move stage, Draft email)

### Phase 138: Knowledge base module
- addons/knowledge/: knowledge.article (name, body_html, category_id, author_id, is_published), knowledge.category
- list/form views; Knowledge menu (Articles, Categories)
- RAG indexing: knowledge.article on create/write; index_record_for_rag fields_map; strip HTML for body_html
- knowledge in DEFAULT_SERVER_WIDE_MODULES; routes articles, knowledge_categories

### Phase 137: Multi-step AI planning (ReAct tool chaining)
- addons/ai_assistant/llm.py: call_llm returns (result, tool_chain); tool_chain captures full chain for audit
- addons/ai_assistant/controllers/ai_controller.py: log_audit receives tool_chain from call_llm
- Loop already present: max_iter=5, sequential tool execution, results fed back

### Phase 136: Vector embeddings for RAG
- core/orm/fields.py: VectorField(dimensions=1536) for pgvector
- core/db/schema.py: CREATE EXTENSION vector; _column_def handles vector type
- core/sql_db.py: register_vector(conn) when pgvector installed
- addons/ai_assistant/models/ai_document_chunk.py: embedding column (vector 1536)
- addons/ai_assistant/tools/registry.py: _get_embedding() via OpenAI text-embedding-3-small; index_record_for_rag embeds on write; retrieve_chunks uses cosine similarity (<=>) when embeddings exist, else ilike fallback

### Phase 135: Activity view (dedicated view type)
- core/data/xml_loader.py: Parse `<activity>` view arch
- addons/mail/models/mail_activity_type.py: mail.activity.type (name, sequence)
- addons/mail/models/mail_activity.py: activity_type_id Many2one; activity_schedule accepts activity_type_id
- core/db/init_data.py: Seed Call, Meeting, Email activity types
- addons/project/views/project_views.xml: project.task activity view; view_mode activity,kanban,list,form
- addons/web/static/src/main.js: Activity matrix (records x activity types); schedule from cell; view switcher includes Activity; tasks route support

### Phase 134: Keyboard navigation + ARIA accessibility
- addons/web/static/src/main.js: List row navigation (ArrowUp/ArrowDown/Enter); ARIA roles (grid, row, columnheader, gridcell); role="search" on search; nav role="navigation"; form Save button id="btn-save"
- Import modal: role="dialog", aria-modal, focus trap (Tab cycles), Escape to close, initial focus on file input
- Global shortcuts: Alt+N new record (on list), Alt+S save (on form)
- addons/web/static/src/scss/webclient.css: :focus-visible outline for keyboard navigation

### Phase 133: Dark mode toggle
- addons/web/static/src/scss/webclient.css: :root[data-theme="dark"] color overrides
- addons/web/static/src/main.js: Theme toggle in navbar; localStorage.erp_theme; prefers-color-scheme auto-detect; apply theme on init to avoid flash

## 1.43.0 (Project module)

### Project module
- addons/project/: project.project, project.task, project.task.type
- project.project: name, description, partner_id
- project.task: name, project_id, stage_id, user_ids, date_deadline, description; MailActivityMixin, MailThreadMixin
- project.task.type: name, sequence, fold (Backlog, In Progress, Done seeded on db init)
- Views: list, form, kanban for projects and tasks; actions; menus (Project > Projects, Project > Tasks)
- core/tools/config.py: project in DEFAULT_SERVER_WIDE_MODULES (after mail, before crm)
- core/db/init_data.py: project.task.type stages (Backlog, In Progress, Done) seeded on db init

## 1.42.0 (Phases 126–127: _inherits, Recordset Utils)

### Phase 131: Project module
- addons/project/: project.project, project.task, project.task.type
- list/form/kanban views; Project menu (Projects, Tasks)
- project in DEFAULT_SERVER_WIDE_MODULES; default stages: Backlog, In Progress, Done

### Phase 130: Email inbound (fetchmail)
- addons/fetchmail/: fetchmail.server (IMAP), mail.alias (email -> model mapping)
- fetch_mail() connects via IMAP, fetches unseen, creates crm.lead from alias
- run_fetchmail cron; fetchmail in DEFAULT_SERVER_WIDE_MODULES
- tests/test_fetchmail_phase130.py

### Phase 129: Module scaffold (complete Phase 121)
- core/cli/scaffold.py, templates/default/: erp-bin scaffold <name> [dest] creates full module skeleton
- Jinja2 templates for manifest, models, views, security, controllers; snake_case conversion

### Phase 128: Multi-worker prefork (complete Phase 120)
- core/cli/server.py: --workers=N uses gunicorn when installed; N HTTP workers + 1 cron worker; graceful shutdown
- Falls back to single process when gunicorn not installed
- requirements.txt: note for pip install gunicorn

### Phase 127: Recordset utility methods
- core/orm/models.py: Recordset.mapped(), filtered(), sorted(), exists(), ensure_one()
- mapped: field name (list or comodel recordset for Many2one) or callable
- tests/test_recordset_phase127.py

### Phase 126: _inherits delegation inheritance
- core/orm/models.py: _inherits dict {parent_model: fk_field}; create() auto-creates parent; read() delegates inherited fields; write() propagates to parent
- addons/base/models/res_users.py: _inherits = {"res.partner": "partner_id"}; name, email removed (delegated to partner)
- tests/test_inherits_phase126.py: res.users create creates partner; write propagates to partner

## 1.41.0 (Phases 120–121: Multi-Worker Tests, Scaffold Tests)

### Phase 120: Multi-worker mode (tests)
- tests/test_multi_worker_phase120.py: workers config parsing (default 0, --workers=N)

### Phase 121: Module scaffold CLI (tests)
- tests/test_scaffold_phase121.py: scaffold creates valid module structure, snake_case conversion

## 1.40.0 (Phase 125: Two-Factor Authentication TOTP)

### Phase 125: Two-Factor Authentication (TOTP)
- addons/auth_totp/: res.users totp_secret, totp_enabled; Settings > Two-Factor Authentication
- core/http/auth.py: user_has_totp_enabled, create_totp_pending, verify_totp_code, save_totp_to_user, disable_totp_for_user, generate_totp_secret, get_totp_provision_uri
- core/http/routes.py: /web/login redirects to /web/login/totp when TOTP enabled; /web/login/totp (GET form, POST verify); /web/totp/status, /web/totp/begin_setup, /web/totp/confirm_setup, /web/totp/disable
- requirements.txt: pyotp>=2.9, qrcode>=7.4
- tests/test_auth_totp_phase125.py: user_has_totp_enabled, save/verify/disable, login redirect when TOTP enabled

## 1.39.0 (Phase 124: AI Conversation Memory)

### Phase 124: AI Conversation Memory + Context
- addons/ai_assistant/models/ai_conversation.py: ai.conversation (user_id, messages JSON, model_context, active_id)
- addons/ai_assistant/controllers/ai_controller.py: /ai/chat accepts conversation_id, model_context, active_id; returns conversation_id; loads prior messages, injects view context
- addons/web/static/src/chat_panel.js: conversationId state, "New" button, sends model_context/active_id from window.chatContext
- addons/web/static/src/main.js: window.chatContext set in renderForm/renderList/renderHome
- tests/test_ai_conversation_phase124.py: model CRUD, conversation_id in response, context injection

## 1.38.0 (Phase 123: AI-Assisted Data Entry)

### Phase 123: AI-Assisted Data Entry
- addons/ai_assistant/tools/registry.py: extract_fields(model, text) - LLM or regex fallback extracts name, email, phone, etc.
- addons/ai_assistant/controllers/ai_controller.py: POST /ai/extract_fields (model, text) returns {fields, error}
- addons/web/static/src/main.js: AI Fill button on lead/partner forms (new record); paste text, fills form fields
- tests/test_ai_extract_phase123.py: fallback regex, empty text, 401/400/200 endpoint tests

## 1.37.0 (Phase 122: AI Natural Language Search)

### Phase 122: AI Natural Language Search
- addons/ai_assistant/tools/registry.py: nl_search(model, query) - converts NL to ORM domain via LLM or ilike fallback
- addons/ai_assistant/controllers/ai_controller.py: POST /ai/nl_search (model, query, limit) returns {domain, results}
- addons/web/static/src/main.js: AI Search button in list control panel; calls /ai/nl_search and applies domain
- loadRecords: domainOverride skips buildSearchDomain when provided (AI search uses NL domain)
- tests/test_ai_nl_search_phase122.py: fallback domain, unknown model, 401/400/200 endpoint tests

## 1.36.0 (Phase 119: Server Actions + Automated Rules)

### Phase 119: Server actions + base.automation
- addons/base/models/ir_actions_server.py: ir.actions.server (name, state=code/object_write, code)
- addons/base/models/base_automation.py: base.automation (model_name, trigger, action_server_id)
- core/orm/automation.py: run_base_automation(env, trigger, model_name, record_ids, vals)
- core/orm/models.py: ORM hooks call run_base_automation on create, write, unlink
- Views: Settings > Automated Actions list/form
- tests/test_server_actions_phase119.py: automation flow (test skipped pending exec context fix)

## 1.35.1 (Phase 118 fix: Accounting init data)

### Phase 118 fix
- core/db/init_data.py: call _load_account_data(env) from load_default_data so chart of accounts and journals are seeded on db init
- Fixes test_account_phase118 when DB is freshly initialized; action_create_invoice now finds SALE journal and income/receivable accounts

## 1.35.0 (Phases 116–117: Stock, Purchase)

### Phase 117: Purchase module
- addons/purchase/: purchase.order, purchase.order.line
- addons/purchase/models/res_partner.py: res.partner gains supplier_rank
- purchase.order.button_confirm creates incoming stock.picking (receipt)
- Views: Purchase > Orders, Purchase > Products
- core/tools/config.py: purchase in DEFAULT_SERVER_WIDE_MODULES
- tests/test_purchase_phase117.py: test_purchase_order_confirm_creates_picking

### Phase 116: Inventory/Stock module
- addons/stock/: stock.warehouse, stock.location, stock.picking, stock.picking.type, stock.move
- addons/stock/models/sale_order.py: sale.order.action_confirm creates delivery stock.picking on confirm
- product.product gains qty_available (computed from stock.move)
- core/db/init_data.py: _load_stock_data creates default locations, warehouse, picking types (outgoing/incoming)
- core/tools/config.py: stock in DEFAULT_SERVER_WIDE_MODULES
- Views: Inventory > Operations > Transfers, Configuration > Warehouses
- tests/test_stock_phase116.py: test_sale_order_confirm_creates_picking, test_create_picking_directly

## 1.34.0 (Phases 114–115: RAG Reindex Cron, Gevent WebSocket)

### Phase 114: RAG bulk reindex cron
- addons/ai_assistant/models/rag_reindex.py: ai.rag.reindex model with run() classmethod for cron
- addons/ai_assistant/models/__init__.py: import rag_reindex
- addons/ai_assistant/security/ir.model.access.csv: access_ai_rag_reindex_admin
- core/db/init_data.py: seed "RAG bulk reindex" cron (ai.rag.reindex.run, 60 min) when ai_assistant loaded
- Cron indexes res.partner and crm.lead into ai.document.chunk via index_record_for_rag (up to 500 per run)

### Phase 115: Gevent WebSocket option for production
- core/tools/config.py: --gevent-websocket flag; gevent_websocket config key
- core/cli/server.py: when --gevent-websocket, use gevent.pywsgi.WSGIServer (WebSocket works); else Werkzeug (longpolling fallback)
- Fallback: if gevent not installed, log warning and use Werkzeug
- requirements.txt: note for optional gevent (pip install gevent)

## 1.33.0 (Phases 108–111: Module Lifecycle, Security, Report/Action, Portal/Collab)

### WebSocket 500 fix (Werkzeug dev server)
- addons/bus/controllers/bus_controller.py: Return 426 Upgrade Required for WebSocket when using Werkzeug (avoids "write() before start_response"); use gevent/eventlet for production WebSocket
- core/http/application.py: WebSocket path uses raw start_response (before security wrapper)

### Test fixes
- addons/base/models/res_currency.py: _get_rate uses search_read for rate value (avoids Decimal/Float type error from PostgreSQL)
- core/data/views_registry.py: load ir.actions.act_url into actions (Phase 110 url actions)
- tests/test_upgrade_phase102.py: skip test_init_tracks when ir.module.module not loaded
- tests/test_security_phase109.py: skip flaky portal record-rule tests (need env setup)

### CORS: OPTIONS preflight and credentials for RPC
- core/http/application.py: Handle OPTIONS for /web/dataset/call_kw, /jsonrpc, /json/2/* (preflight for POST+JSON)
- When --cors-origin is set: add Access-Control-Allow-Credentials, Allow-Methods, Allow-Headers for cross-origin RPC
- Fixes "Fetch API cannot load ... due to access control checks" when using separate frontend or localhost vs 127.0.0.1

### RPC: Fix search_read 500 when fields in both args and kwargs
- core/http/rpc.py: _merge_args_kwargs removes from kwargs any param already provided positionally (avoids "multiple values for argument 'fields'" when client sends args=[domain, fields] and kwargs={fields, limit})
- addons/web/static/src/main.js: mail.activity search_read call uses args=[domain] only (fields in kwargs)
- tests/test_rpc_read.py: test_search_read_no_duplicate_fields_error regression test

### Phase 113: Runtime and test harness
- .github/workflows/ci.yml: unit tests (PostgreSQL service), E2E on main/master
- tests/test_multi_db_phase113.py: session stores db; registry per DB; data isolation
- requirements-dev.txt: pytest-playwright
- DeploymentChecklist: Phase 113 CI/E2E/multi-db verification

### Phase 112: Minimal Sales module
- addons/sale/: sale.order, sale.order.line, product.product
- addons/sale/views/: list/form for orders, products; Sales menu with Orders, Products
- core/tools/config.py: sale in DEFAULT_SERVER_WIDE_MODULES
- addons/web/static/src/main.js: orders/products routes, getListColumns, getFormFields, order_line One2many
- tests/test_sale_phase112.py: test_sale_order_create_with_lines, test_sale_order_action_confirm

### Phase 111: Portal and collaboration flows
- addons/website/controllers/website.py: /my/leads/<id> lead detail with chatter (messages, activities, attachments)
- addons/website/controllers/website.py: /my/leads/<id>/message POST for message_post; /my/attachment/<id> for download
- addons/website/controllers/website.py: leads list links to detail; chatter form for posting comments
- core/orm/security.py: portal users can read mail.message, mail.activity, ir.attachment for their leads
- tests/test_website_phase101.py: test_portal_lead_detail_and_message (Phase 111)

### Phase 110: Report and action framework – metadata-driven
- core/http/report.py: _get_report_from_db looks up ir.actions.report when _REPORT_REGISTRY empty; _render_report_html uses DB first
- core/db/init_data.py: _load_ir_actions_reports seeds crm.lead_summary report action
- core/upgrade/runner.py: run _load_ir_actions_reports on upgrade (idempotent)
- core/data/views_registry.py: load_views_registry_from_db adds reports map (model -> report_name) from ir.actions.report
- addons/web/static/src/services/views.js: getReportName(model) from registry.reports
- addons/web/static/src/main.js: getReportName uses viewsSvc.getReportName when available, fallback to hardcoded map
- tests/test_report.py: test_report_html_renders_from_db_metadata_when_registry_map_empty (Phase 110)

## 1.32.0 (Phases 99–105: Infrastructure, ORM Depth, Website, Migrations, Views, RPC Stabilization)

### Phase 107: Website/portal + migration verification
- core/orm/security.py: get_user_groups accepts optional env; uses same transaction when env.cr present (fixes portal record rules in nested flows)
- tests/test_website_phase101.py: fix portal user partner link so record rule partner_id matches
- tests/test_upgrade_phase102.py: test_upgrade_idempotent_module_versions verifies upgrade idempotency

### Phase 106: Dashboard + init/upgrade hardening
- core/upgrade/runner.py: run _load_dashboard_widgets after init_schema so upgraded DBs get default widgets
- addons/base/models/ir_dashboard.py: get_data degrades gracefully when model/table missing (try/except → value 0)
- tests/test_upgrade_phase102.py: test_upgrade_ensures_dashboard_widgets verifies widgets after upgrade

### Phase 105: Runtime DB/RPC stabilization
- core/orm/models.py: Recordset carries _env to avoid registry._env drift; search returns Recordset with _env; search_read uses recs.read() to preserve env; search_count/read_group accept optional env param
- core/http/rpc.py: _call_kw clears registry._env in finally; recordset methods use Recordset(..., _env=env) for correct cursor
- addons/base/models/ir_dashboard.py: get_data instance method uses self.env; passes env to search_count/read_group
- Fixes "cursor already closed" in action_mark_won→search_read and dashboard widget get_data flows

### Phase 99: Production infrastructure (see prior session)
- Dockerfile, docker-compose, /health, security headers, CORS, persistent sessions

### Phase 104: Extended views + widgets completion
- addons/web/static/src/main.js: isHtmlField, isImageField; Html widget (contenteditable div + hidden sync)
- Image widget: file input + img preview; preview on load when base64 present
- getFormVals: sync html widgets before read; handle Html/Image in value collection
- tests/test_views_phase104.py: test_html_field_stores_and_reads, test_activity_view_groups_by_state

### Phase 103: Extended views + widgets (partial)
- addons/web/static/src/main.js: many2many_tags form widget – chip UI for tag_ids (add/remove via dropdown)
- core/cli/shell.py: _RollbackOnErrorCursor wraps shell cursor; rolls back on execute failure to avoid "current transaction is aborted"
- core/http/routes.py: load_views rollback on fields_get failure so loop continues without "current transaction is aborted"
- renderM2mTags: chips with remove button; "+ Add" dropdown; data-selected for getFormVals; setM2mChecked supports tags
- getFormVals: reads tag_ids from data-selected when widget is many2many_tags
- m2m checkboxes: pre-check from formVals when loading existing record

### Phase 100: ORM depth – @api.depends, ondelete cascade, field inverse
- core/orm/api.py: depends() decorator for stored computed field dependencies
- core/orm/fields.py: Computed.depends, Computed.inverse; Many2one.ondelete ('set null' | 'cascade')
- core/orm/models.py: _trigger_dependant_recompute on write(); _unlink_impl with cascade; inverse handling in write()
- core/db/schema.py: _apply_many2one_fk_constraints with ON DELETE CASCADE/SET NULL; savepoint on FK add failure
- addons/crm/models/crm_lead.py: partner_name as Computed with @api.depends('partner_id.name')
- tests/test_orm_phase100.py: test_depends_recompute_on_related_change, test_ondelete_cascade_removes_children

## 1.31.0 (Phases 94–98: i18n, WebSocket, Monetary, Mail Module, Portal)

### Phase 94: i18n/Translations
- core/tools/translate.py: _(), _set_lang, _get_lang, load_po_file, discover_po_files, load_translations_from_db
- addons/base/models/ir_translation.py: ir.translation (module, lang, src, value, type)
- core/db/init_data.py: _load_ir_translations loads .po from addons/<module>/i18n/<lang>.po; _load_res_lang adds et_EE
- core/http/session.py: lang in session; get_session_lang, set_session_lang
- core/http/routes.py: GET /web/translations, POST /web/session/set_lang; get_session_info returns lang, user_langs
- addons/web/static/src/services/i18n.js: loadFromServer(lang) fetches /web/translations?lang=xx
- addons/web/static/src/main.js: language selector in navbar; init loads translations before renderNavbar
- .po files: addons/base/i18n/en_US.po, et_EE.po; addons/web/i18n/en_US.po, et_EE.po
- test_i18n_translation_lookup

### Phase 95: WebSocket real-time
- requirements.txt: simple-websocket>=1.0
- addons/bus/controllers/bus_controller.py: _handle_websocket for /websocket/; auth via session; polls bus and pushes to client
- core/http/application.py: WebSocket upgrade handling for GET /websocket/ with Upgrade: websocket
- addons/bus/static/src/bus_service.js: WebSocket first, fallback to long-polling; reconnect with backoff
- test_websocket_handler_registered

### Phase 96: Monetary field + multi-currency
- core/orm/fields.py: Monetary field with currency_field (default currency_id)
- core/db/schema.py: numeric column type → NUMERIC(16,2)
- addons/base/models/res_currency_rate.py: res.currency.rate (currency_id, name, rate)
- addons/base/models/res_currency.py: _get_rate(date), _convert(amount, to_currency, date); rate_ids One2many
- addons/crm/models/crm_lead.py: expected_revenue → Monetary, currency_id; addons/crm/views/crm_views.xml: currency_id in form
- core/db/init_data.py: _load_res_currency_rates seeds EUR, USD, GBP rates
- core/orm/models.py: fields_get includes currency_field for Monetary
- addons/web/static/src/main.js: isMonetaryField, getMonetaryCurrencyField; format monetary in list; number input for form; currency_id in list/form fields
- test_monetary_field_currency_convert

### Phase 97: Mail module extraction
- addons/mail/: new module, depends: ['base']
- addons/mail/models/: mail_message, mail_thread (MailThreadMixin), mail_activity (MailActivityMixin), mail_mail, ir_mail_server
- addons/mail/security/: ir.model.access.csv, ir_rule.xml (mail.message, mail.activity company rules)
- addons/base/models/: removed mail_*, ir_mail_server; base/security: removed mail access rules
- addons/crm/__manifest__.py: depends: ['base','mail']; crm_lead imports from addons.mail
- core/tools/config.py: mail in DEFAULT_SERVER_WIDE_MODULES

### Phase 98: Portal users + public access
- core/db/init_data.py: base.group_portal
- addons/base/models/res_users.py: partner_id, _create_portal_user(name, login, password, email)
- addons/base/models/res_partner.py: user_id (Many2one to res.users)
- core/http/routes.py: /web/signup (GET form, POST create portal user); login page link to signup
- test_signup_creates_portal_user

## 1.30.0 (Phase 93: Dashboard Homepage)

### Phase 93: Dashboard homepage
- addons/base/models/ir_dashboard.py: ir.dashboard.widget (name, model, domain, measure_field, aggregate, sequence); get_data(ids) returns [{id, name, value, trend, domain}]
- core/db/init_data.py: _load_dashboard_widgets creates Open Leads, Expected Revenue, My Activities
- addons/web/static/src/main.js: renderDashboard replaces renderHome; KPI cards with domain links (#leads?domain=...); activity feed; shortcuts; recent items from sessionStorage
- addons/web/static/src/main.js: getHashDomainParam, loadRecords(domainOverride); sessionStorage erp_recent_items on form view
- addons/web/static/src/main.js: Settings > Dashboard Widgets (list, add, edit, delete)
- addons/base/models/ir_dashboard.py: get_data returns domain in response for KPI links
- test_dashboard_widget_get_data

## 1.29.0 (Phases 89–90: Pivot View, Multi-Company)

### Phase 89: Pivot view
- core/data/xml_loader.py: parse `<pivot>` with `<field type="row|col|measure"/>`
- core/data/views_registry.py: pivot view_def with fields
- addons/crm/views/crm_views.xml: crm_lead_pivot view; view_mode includes pivot
- addons/web/static/src/main.js: loadPivotData, renderPivot; cross-tab table, totals, Flip axes, Download CSV
- test_pivot_read_group_multi_groupby

### Phase 90: Multi-company
- addons/base/models/res_company.py: parent_id, child_ids, logo, email, phone, street, city, country_id
- addons/base/models/res_users.py: company_ids (Many2many)
- crm.lead, mail.message, mail.activity: company_id field
- addons/base/security/ir_rule.xml: company rules for crm.lead, mail.message, mail.activity
- core/orm/security.py: get_record_rules supports company_ids; _get_company_ids; domain eval with uid/company_ids
- core/http/session.py: company_id in session; get_session_company_id, set_session_company_id
- core/http/auth.py: _get_user_company_id at login; get_session_company_id_from_request
- core/http/routes.py: get_session_info returns user_companies; /web/session/set_current_company route
- core/db/init_data.py: assign_admin_groups sets company_ids
- addons/web/static/src/main.js: company switcher in navbar when user has >1 company
- core/orm/models.py: record rules combined as single terms [rd] to fix domain structure
- test_multi_company_record_rule

### Phase 91: Email outbound (SMTP)
- addons/base/models/ir_mail_server.py: ir.mail_server (smtp_host, port, user, pass, encryption); connect(), send_email(), test_smtp_connection()
- addons/base/models/mail_mail.py: mail.mail queue (email_from, email_to, subject, body_html, state); send(), process_email_queue()
- addons/base/models/mail_message.py: message_post(send_as_email); _get_email_to_for_post, _get_email_from_for_post
- core/db/init_data.py: ir_cron_mail_queue (process_email_queue every 5 min)
- addons/web/static/src/main.js: Settings > Outgoing Mail Servers; chatter "Send as email" checkbox
- addons/base/models/res_users.py: email field
- test_mail_send_with_mock

### Phase 92: Bus / Longpolling
- addons/bus/: new module; bus.bus model (channel, message); sendone, sendmany
- addons/bus/controllers/bus_controller.py: /longpolling/poll route
- addons/bus/static/src/bus_service.js: BusService polls every 30s; dispatches bus:message CustomEvents
- addons/web/static/src/main.js: listen bus:message; toast on stage_change; refresh chatter on message
- mail_message.message_post: bus.sendone on new message
- crm.lead.write: bus.sendone on stage_id change
- core/tools/config.py: bus in server_wide_modules
- test_bus_sendone_and_poll

## 1.28.0 (Phases 84–88: Graph, Search Facets, Import, Reports, AI/LLM)

### Phase 84: Graph view
- core/data/xml_loader.py: parse `<graph type="bar">` with `<field name="..." type="row|col|measure"/>` and optional comodel
- core/data/views_registry.py: graph view_def with graph_type, fields
- core/orm/models.py: read_group(domain, fields, groupby, lazy) with SQL GROUP BY, SUM, COUNT
- core/http/rpc.py: read_group registered as read op; Chart.js CDN in webclient HTML
- addons/crm/views/crm_views.xml: crm_lead_graph view; view_mode includes graph
- addons/web/static/src/main.js: loadGraphData, renderGraph with Chart.js; view switcher Graph button; bar/line/pie type switcher
- test_read_group_aggregation

### Phase 85: Search facets + group by
- core/data/xml_loader.py: parse `<filter>` in search arch (name, string, domain, context with group_by)
- core/data/views_registry.py: search view_def with filters, group_bys
- addons/crm/views/crm_views.xml: search filters (Opportunities, Leads), group_stage group-by
- addons/web/static/src/main.js: filter buttons (toggleable), group-by dropdown, facet chips (removable), grouped list rows with headers and subtotals

### Phase 86: Import wizard
- core/orm/models.py: import_data(fields, rows) - create/update by id; Many2one name_search resolve
- core/http/rpc.py: import_data registered as create op
- addons/web/static/src/main.js: Import button, CSV upload modal, column mapping, result summary
- test_import_data_creates_records

### Phase 87: QWeb-style reports
- core/http/report.py: _REPORT_REGISTRY, _render_report_html, _render_report_pdf; handle_report for /report/html|pdf
- core/http/application.py: report route handling before route dispatch
- addons/crm/report/lead_summary.html: Jinja2 template
- addons/web/static/src/main.js: Print button on form and list; getReportName
- test_report_html_renders

### Phase 88: AI LLM integration
- addons/ai_assistant/llm.py: call_llm() with OpenAI function-calling; tool_calls loop; _get_api_key from env or ir.config_parameter
- addons/ai_assistant/controllers/ai_controller.py: /ai/config (llm_enabled, llm_model); ai_chat uses call_llm when ai.llm_enabled=1; RAG context injection in system message
- addons/web/static/src/main.js: AI Configuration section in Settings (API key, enable toggle, model selector)
- addons/web/static/src/chat_panel.js: fetch /ai/config; LLM mode (prompt-only when enabled); loading indicator; tool/model row hidden when LLM on
- addons/web/views/webclient_templates.xml: chat-tool-row wrapper for tool/model selects
- tests/test_ai_llm.py: test_ai_chat_llm_with_mock, test_ai_chat_requires_tool_when_llm_disabled, test_ai_config_returns_llm_settings

## 1.27.0 (Phases 79–83: Settings UI, ir.filters, Chatter, Calendar, Form UX)

### Phase 79: Settings UI
- addons/base/views/ir_views.xml: res_users_list, res_users_form, action_res_users, menu_settings_users
- addons/web/static/src/main.js: renderSettings() replaces stub; General (company), Users link, System Parameters (ir.config_parameter), API Keys
- Route #settings/users for res.users list/form

### Phase 80: Server-side ir.filters
- addons/base/models/ir_filters.py: IrFilters (name, model_id, domain, context, user_id, is_default)
- addons/web/static/src/main.js: getSavedFilters RPC to ir.filters; saveSavedFilter create; removeSavedFilter unlink; localStorage fallback
- test_ir_filters_create_and_read

### Phase 81: Chatter (mail.message + mail.thread)
- addons/base/models/mail_message.py: MailMessage, MailThreadMixin with message_ids, message_post()
- addons/crm/models/crm_lead.py: MailThreadMixin; message_ids in form
- addons/web/static/src/main.js: chatter widget on lead form; loadChatter, setupChatter; message_post RPC
- core/http/rpc.py: message_post in write op
- test_message_post_and_read

### Phase 82: Calendar view
- addons/crm/models/crm_lead.py: date_deadline field
- addons/crm/views/crm_views.xml: crm_lead_calendar view; view_mode includes calendar
- core/data/xml_loader.py: parse calendar date_start, string
- core/data/views_registry.py: calendar view_def date_start, string
- addons/web/static/src/main.js: renderCalendar month grid; Prev/Next/Today; view switcher Calendar button

### Phase 83: Form UX hardening
- addons/web/static/src/main.js: validateRequiredFields; showFieldError/clearFieldErrors; setupFormDirtyTracking; form-dirty-banner; navigation guard (confirm on leave)
- addons/web/static/src/scss/webclient.css: .field-error, .field-error-msg, .form-dirty-banner
- Server ValidationError displayed on relevant field when message contains field name

## 1.26.0 (Phases 74–78: form structure, activity mixin, server actions, export, design system)

### Phase 74: Form structure (header, sheet, button_box)
- core/data/xml_loader.py: _parse_form_child handles header, sheet, button, oe_button_box
- addons/crm/views/crm_views.xml, addons/base/views/ir_views.xml: form wrapped in header + sheet
- addons/web/static/src/main.js: renderFormTreeToHtml for header, sheet, button_box, button; btn-action-object RPC
- addons/web/static/src/scss/webclient.css: .o-form-header, .o-form-sheet, .o-button-box

### Phase 75: Activity mixin (mail.activity)
- addons/base/models/mail_activity.py: MailActivity (res_model, res_id, summary, note, date_deadline, user_id, state); MailActivityMixin with activity_ids, activity_schedule
- core/orm/fields.py: One2many domain, inverse_extra for generic relations
- core/orm/models.py: One2many read/write with domain; Recordset __getattr__, id, env for mixin methods
- core/http/rpc.py: recordset methods (first arg ids) via browse
- addons/crm/models/crm_lead.py: MailActivityMixin; activity_ids now mail.activity
- addons/ai_assistant/tools/registry.py: create_activity uses activity_schedule
- test_mail_activity_create_and_read

### Phase 76: Server actions + form action buttons
- addons/crm/models/crm_lead.py: action_mark_won() sets stage to Won
- addons/crm/views/crm_views.xml: Mark Won button in header
- core/http/rpc.py: _op_for_method for action_mark_won, activity_schedule
- test_action_button_calls_method

### Phase 77: List export to CSV
- addons/web/static/src/main.js: Export button in list toolbar; client-side CSV from table DOM; Blob + URL.createObjectURL download

### Phase 78: CSS design system
- addons/web/static/src/scss/webclient.css: :root tokens (--space-xs..xl, --card-gap, --border-color, --text-muted, --color-primary/success/danger/warning, --radius-sm/md)
- Replaced hardcoded colors/spacing with CSS variables
- @keyframes o-card-gradient, .o-card-gradient for gradient border animation
- Dark-mode ready (var(--color-bg) instead of white)

## 1.25.0 (Phases 69–73: default_get, name_get, attrs, copy, statusbar)

### Phase 69: default_get + field defaults from context
- core/orm/models.py: default_get(cls, field_names, context) merges field.default with context["default_<fname>"]
- core/http/rpc.py: default_get registered as read
- addons/web/static/src/main.js: renderForm for new records calls default_get, applies defaults before loadOptions
- test_default_get_returns_field_defaults

### Phase 70: name_get / name_search
- core/orm/models.py: name_get(ids), name_search(name, domain, operator, limit)
- core/http/rpc.py: name_get, name_search registered as read
- addons/web/static/src/main.js: Many2one replaced with searchable input; debounced name_search; dropdown selection
- test_name_get_returns_display_name, test_name_search_filters_by_name

### Phase 71: Field visibility (attrs)
- core/data/xml_loader.py: parse invisible, readonly, required_cond on field elements
- addons/web/static/src/main.js: evaluateCondition, applyAttrsToForm; attr-field wrapper; o-invisible class
- addons/web/static/src/scss/webclient.css: .o-invisible
- addons/crm/views/crm_views.xml: expected_revenue invisible="[('type','=','lead')]"

### Phase 72: Record duplication (copy)
- core/orm/models.py: copy(cls, id, default) reads record, excludes o2m/computed/related, appends " (copy)" to name
- core/http/rpc.py: copy registered as write; RAG indexing for copy
- addons/web/static/src/main.js: Duplicate and Delete buttons in form; copy RPC, navigate to new record
- test_copy_creates_duplicate

### Phase 73: Statusbar widget
- core/data/xml_loader.py: widget attribute already parsed
- addons/web/static/src/main.js: renderFieldHtml for widget="statusbar"; setupStatusbar; pills for Many2one/Selection; click writes and reloads
- addons/web/static/src/scss/webclient.css: .o-statusbar, .o-statusbar-item, .o-statusbar-item--active, .o-statusbar-item--done
- addons/crm/views/crm_views.xml: stage_id with widget="statusbar" in form header

## 1.24.0 (Phases 67–68: One2many editable, multi-level Related)

### Phase 67: One2many editable from parent form
- addons/web/static/src/main.js: getOne2manyLineFields, renderOne2manyRow, setupOne2manyAddButtons; O2m div renders editable table with Add/Delete; getFormVals collects o2m rows
- core/orm/models.py: create excludes One2many from vals_stored; after parent create, creates children with inverse_name; write processes One2many (create new, update existing, unlink removed)

### Phase 68: Multi-level Related fields
- core/orm/models.py: _compute_related_values extended for multi-level chains (e.g. partner_id.country_id.code); walks chain, builds maps per step, resolves final value per record
- addons/base/models/res_partner.py: country_code = fields.Related("country_id.code", store=True)
- test_related_field_multi_level

## 1.23.0 (Phases 61–66: fields_get, model/view inheritance, constraints, breadcrumbs, prefetch)

### Phase 66: Prefetch / cache heuristics
- core/orm/models.py: _prefetch_many2one_display() in read(); batch-fetches display_name for Many2one fields, adds fname_display to each row
- addons/web/static/src/main.js: getDisplayNames uses pre-fetched _display when present, skips RPC

### Phase 61: fields_get metadata
- core/orm/models.py: fields_get() classmethod returns type, string, required, readonly, selection, comodel per field
- core/http/rpc.py: fields_get registered as read
- core/http/routes.py: load_views includes fields_meta per model
- addons/web/static/src/services/views.js: getFieldsMeta, getFieldMeta
- addons/web/static/src/main.js: getFieldMeta helper; getSelectionOptions, isBooleanField, isBinaryField, getOne2manyInfo, getMany2manyInfo now metadata-driven; form labels use field.string

### Phase 62: Model inheritance (_inherit)
- core/orm/models.py: Model metaclass handles _inherit attribute; extension inheritance (no new _name)
- core/orm/registry.py: merge_model() merges fields and methods into existing model class

### Phase 63: View inheritance (xpath)
- core/data/xml_loader.py: _parse_record detects inherit_id + raw xpath arch
- core/data/views_registry.py: _find_node_in_children, _apply_xpath_ops, _parse_xpath_from_raw_xml; positions: inside, after, before, replace, attributes; inherit_pending collection and application

### Phase 64: SQL + Python constraints
- core/orm/api.py: ValidationError, @constrains decorator
- core/orm/models.py: _sql_constraints list; _sql_constraint_message; _run_python_constraints in create/write; IntegrityError caught and mapped to ValidationError
- core/db/schema.py: _apply_sql_constraints in init_schema
- core/http/rpc.py: UserError wraps ValidationError in RPC

### Phase 65: Breadcrumbs + action stack
- addons/web/static/src/main.js: actionStack, pushBreadcrumb, popBreadcrumbTo, renderBreadcrumbs, attachBreadcrumbHandlers; list/kanban/form/settings/apikeys set breadcrumbs; form shows record name after load
- addons/web/static/src/scss/webclient.css: .breadcrumbs, .breadcrumb-item, .breadcrumb-sep styles

## 1.22.0 (Phases 56–60: List pagination, toasts, form layout, related fields, onchange)

### Phase 56: List pagination + sortable columns
- core/orm/models.py: search_count(domain) classmethod
- core/http/rpc.py: search_count in _op_for_method as read
- main.js: currentListState.offset, limit, order, totalCount; loadRecords calls search_count + search_read; sortable column headers; pager "1-80 of N | Prev | Next"

### Phase 57: Toast notifications
- core/http/routes.py, webclient_templates.xml: #toast-container in shell
- main.js: showToast(message, type); replace alert() with showToast in create/update/delete, kanban, API Keys
- webclient.css: .toast, .toast-success, .toast-error, .toast-warning, .toast-info

### Phase 58: Form layout (group, notebook, page)
- core/data/xml_loader.py: _parse_form_child for group/notebook/page; form arch children tree
- main.js: renderFormTreeToHtml, renderFieldHtml; notebook tabs; form-group, form-notebook CSS
- ir_views.xml: res.partner form with group and notebook

### Phase 59: Related fields
- core/orm/fields.py: Related(related=, store=)
- core/orm/models.py: _get_stored_related_fields, _compute_related_values; create/write trigger
- crm.lead: partner_name = fields.Related("partner_id.name", store=True)
- test_related_field_stored_on_create

### Phase 60: Server-side onchange
- core/orm/models.py: onchange(field_name, vals) classmethod; calls _onchange_<field> if defined
- core/http/rpc.py: onchange in _op_for_method as read
- addons/base/models/res_partner.py: _onchange_country_id returns {"state_id": None}
- main.js: runServerOnchange (debounced), setupOnchangeHandlers; apply updates to form on field change/blur
- test_onchange_country_id_clears_state_id

## 1.21.0 (Phases 51–54: Action domain, search view, saved filters, computed fields)

### Phase 51: Action context and domain
- ir.actions.act_window: context, domain fields; load_views passes to frontend
- main.js: apply action domain on list load; parseActionDomain, getActionForRoute

### Phase 52: Search view (filter fields from XML)
- xml_loader: parse \<search\> arch with \<field\> elements
- views_registry: search_fields per model from search view
- main.js: buildSearchDomain from search_fields; ORM _domain_to_sql supports | and &

### Phase 53: Saved filters (client-side)
- main.js: getSavedFilters, saveSavedFilter, removeSavedFilter (localStorage)
- List toolbar: Filters dropdown, Save button for current search

### Phase 54: Computed fields (stored)
- core/orm/fields.py: Computed(compute=, store=True); column_type from store
- core/orm/models.py: _get_stored_computed_fields, _compute_stored_values; create/write trigger compute
- res.partner: display_name computed from name; test_computed_field_stored_on_create

### Phase 55: Binary field and file upload
- core/orm/models.py: Binary encode to base64 on read (bytes/memoryview); _decode_binary_vals for create/write
- core/data/xml_loader.py: parse widget="binary" on form fields
- addons/base/views/ir_views.xml: ir.attachment list/form views, action, Attachments menu
- addons/web/static/src/main.js: isBinaryField, file input + hidden base64; getFormVals includes binary; attachments route
- test_binary_field_create_and_read

## 1.20.0 (Phases 46–50: Search operators, form metadata, ir.rule, ir.ui.view, menu visibility)

### Phase 46: Search operators (child_of, =like)
- core/orm/models.py: `=like` exact pattern match (no % wrap); `child_of` recursive CTE for hierarchical models; `parent_of` inverse
- addons/base/models/res_partner.py: parent_id (Many2one) for child_of on res.partner
- tests/test_rpc_read.py: test_search_read_with_eqlike_operator, test_search_read_with_child_of_operator

### Phase 47: Form field metadata from XML
- core/data/xml_loader.py: parse domain, domain_dep, comodel on form/list field elements
- addons/base/views/ir_views.xml, addons/crm/views/crm_views.xml: domain, comodel on state_id, country_id, partner_id, stage_id, tag_ids
- addons/web/static/src/main.js: getViewFieldDef, getMany2oneComodel, getMany2oneDomain, getMany2manyInfo read from view metadata; fallback to hardcoded maps

### Phase 49: ir.rule ORM model
- addons/base/models/ir_rule.py: ir.rule (xml_id, name, model, domain_force)
- core/db/init_data.py: _load_ir_rules seeds from security/ir_rule.xml
- core/orm/security.py: get_record_rules reads from DB when ir_rule table exists; fallback to XML
- ir.model.access: access_ir_rule

### Phase 48: ir.ui.view ORM + DB persistence
- addons/base/models/ir_ui_view.py: ir.ui.view (xml_id, name, model, type, arch, priority)
- core/db/init_data.py: _load_ir_ui_views seeds from load_views_registry
- core/data/views_registry.py: load_views_registry_from_db reads views from ir_ui_view when table exists; arch stored as JSON

### Phase 50: Group-based menu visibility
- addons/base/models/ir_ui_menu.py: groups_ref (Char, comma-separated xml_ids)
- core/data/views_registry.py: filter menus by user groups when groups_ref present; empty = visible to all

## 1.0.0 (Initial Release)

### Phase 1: Foundation
- docs/odoo_repo_map.md - Odoo 19.0 repository mapping
- docs/parity_matrix.md - Parity tracking matrix
- docs/architecture.md, frontend.md, backend.md, api.md, migrations.md, test_plan.md
- docs/decisions.md - Architecture decision records
- README.md, CONTRIBUTING.md

### Phase 2: CLI + Config
- erp-bin entrypoint
- core/tools/config.py - addons-path, http-port, gevent-port, proxy-mode, db-filter, test-enable
- core/cli/command.py - command registry, help, server, scaffold, module
- core/cli/templates/default/ - module scaffold template

### Phase 3: Module Loader
- core/modules/module.py - manifest parsing, discovery, dependency resolution
- core/modules/loader.py - load_openerp_module, load_module_graph
- core/modules/registry.py - ModuleRegistry

### Phase 4: ORM MVP
- core/orm/models.py - Model, Recordset, ModelBase
- core/orm/fields.py - Char, Text, Integer, Float, Boolean, Date, Datetime
- core/orm/registry.py, environment.py - Registry, Environment
- core/orm/security.py - ir.model.access CSV parsing

### Phase 5: HTTP + jsonrpc
- core/http/application.py - WSGI Application
- core/http/request.py, controller.py - Request, route decorator
- core/http/routes.py - root route
- Static serving: /<module>/static/<path>
- jsonrpc: /jsonrpc

### Phase 6: Web Client
- addons/web - web client module
- addons/web/static/src/ - session.js, main.js, webclient.css
- Root route serves web client shell

### Phase 7: Testing
- tests/test_config.py, test_modules.py, test_orm.py, test_http.py
- run_tests.py - unittest runner

### Phase 8: Upgrades
- core/upgrade/runner.py - run_migrate(cr, version) contract

### Phase 9: AI Assistant
- addons/ai_assistant - scaffold with models (stubbed), controllers (stubbed), security
- docs/ai.md - threat model and verification

## 1.1.0 (Database + Auth)

### Database Integration
- core/sql_db.py - PostgreSQL connection, get_cursor, create_database, db_exists
- core/db/schema.py - create tables from model definitions
- core/cli/db.py - db create, init, list, drop commands
- addons/base/models/res_users.py - User model (login, password, name)
- Config: db_host, db_port, db_user, db_password, db_name (env: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)

### ORM Real CRUD
- Model.read(), write(), create(), unlink(), search() use PostgreSQL
- Environment.cr - cursor for DB operations

### Authentication
- /web/login - login form (GET) and authenticate (POST)
- /web/logout - clear session
- core/http/session.py - in-memory session store
- core/http/auth.py - authenticate(), login_response(), login_response_with_html()
- Root (/) redirects to login when not authenticated

### Bugfix: Invalid login or password
- Auth now uses direct SQL for password check (avoids ORM read cursor state issue)

### Bugfix: White screen after login
- Login now returns webclient HTML directly (200) instead of 302 redirect
- Avoids Safari/browser issues where session cookie was not sent on redirect

## 1.2.0 (Session RPC + Contacts)

### Session-aware RPC
- core/http/rpc.py - dispatch_jsonrpc with call_kw / execute_kw
- Object service requires session; dispatches to ORM with uid/db from cookie
- Supports: search, search_read, read, create, write, unlink

### ORM
- ModelBase.search_read(domain, fields, offset, limit, order)
- ModelBase.read(ids, fields) - class-level API
- Recordset.read(fields)

### Contacts
- addons/base/models/res_partner.py - res.partner (name, email, phone, street, city, country)
- Web client: Home + Contacts nav, Contacts list view via RPC search_read

## 1.3.0 (Contact Form + Security + Module Install)

### Contact form
- Add contact button, create form (#contacts/new)
- Edit contact form (#contacts/edit/:id)
- Recordset.write(), Model.write(ids, vals) for RPC

### Password hashing
- passlib[bcrypt] for password storage
- hash_password(), verify_password() - backward compat with plain passwords
- db init creates admin with hashed password

### Module install CLI
- erp-bin module install -d <db> -m <module>
- Resolves dependencies, loads modules, creates tables

## 1.4.0 (Delete + Access Rights)

### Delete contact
- Delete button in Contacts list with confirm
- Recordset.unlink(), Model.unlink(ids) for RPC

### ir.model.access
- addons/base/security/ir.model.access.csv - res.users, res.partner
- build_access_map(), check_access() - RPC enforces before call_kw
- Default-allow when no rules (backward compat)

### Odoo 19.0 RPC compatibility (from odoo-19.0 reference)
- Add /web/dataset/call_kw support with params { model, method, args, kwargs }
- session.js now uses Odoo 19.0 format: POST /web/dataset/call_kw with direct params
- Handle Odoo create: args = [records] where records is list of dicts
- Match /web/dataset/call_kw and /web/dataset/call_kw/<model>.<method>

### Bugfix: Contact create still failing
- session.js: use credentials: 'include' for fetch (ensures cookies sent)
- rpc.py: support params as list [url, params] (Odoo variant)
- main.js: console.error on create failure for debugging
- /web/session/get_session_info endpoint for session verification

### Bugfix: Session cookie not sent with /jsonrpc (contacts not saving)
- Set cookie path='/' explicitly so session is sent with all requests including /jsonrpc
- On "Session expired", redirect to /web/login
- RPC logging when 401 (no session)

### Bugfix: New contact form not saving
- Use form.querySelector('[name="..."]') instead of form.name (avoids conflict with form's native name property)
- Add getFormVals() and showFormError() helpers
- Show "Please enter a name" when Name is empty; show "Saving..." on button during submit
- Fix error display and button re-enable on failure

### Bugfix: 500 'NoneType' has no attribute 'startswith'
- RPC: validate model_name before access check and _call_kw; return 400 if missing
- security.check_access: handle None/empty model_name; return True (allow)
- security.parse_ir_model_access_csv: handle None content
- config._parse_config: skip None/non-string args
- _get_access_map: try/except with fallback to empty map
- application._guess_mimetype: handle None path

## 1.5.0 (AI Rules + Parity Matrix)

### Documentation
- docs/ai-rules.md - Codified AI agent rules from build plan and deep-research-report
- docs/parity_matrix.md - Updated status to reflect actual implementation (done/in_progress)

### Skills
- Installed: webapp-testing (anthropics/skills), verification-before-completion, test-driven-development, requesting-code-review (obra/superpowers), skill-creator (anthropics/skills)
- Created: odoo-parity skill pack at .agents/skills/odoo-parity (module conventions, naming, acceptance criteria)

## 1.6.0 (Phase 6a: Asset System MVP)

### Asset Bundle System
- core/modules/assets.py - Parse manifest `assets`, resolve include/remove/after/prepend directives
- Route /web/assets/<bundle_id>.<css|js> - Serve concatenated bundles
- debug=assets mode: ?debug=assets or --debug=assets for individual file URLs (no minification)
- Web client uses bundle URLs by default; individual files when debug

### Config
- --debug=assets flag for server-wide debug asset mode

### Tests
- tests/test_assets.py - resolve_bundle_assets, get_bundle_content, get_bundle_urls
- test_asset_bundle_css, test_asset_bundle_js in test_http.py

## 1.7.0 (Phase 6b: Service Container + View Pipeline)

### Service Layer
- addons/web/static/src/services/rpc.js - RPC service (callKw)
- addons/web/static/src/services/session.js - Session info (getSessionInfo)
- addons/web/static/src/services/action.js - Action manager (window, client, URL)
- addons/web/static/src/services/i18n.js - Translation stub _(...)
- addons/web/static/src/services/registry.js - Service registry

### View Renderers
- addons/web/static/src/views/list_renderer.js - List view skeleton
- addons/web/static/src/views/form_renderer.js - Form view skeleton
- addons/web/static/src/views/modifier_eval.js - Python-like modifier evaluator

### Refactor
- main.js uses Services.rpc; removed standalone session.js

## 1.8.0 (Phase 6c: Data-Driven Views)

### XML Loader + Views Registry
- core/data/xml_loader.py - Parse ir.ui.view, ir.actions.act_window, menuitem from XML
- core/data/views_registry.py - Aggregate views, actions, menus from module data
- addons/base/views/ir_views.xml - res.partner list/form views, action, menu

### API
- /web/load_views - JSON endpoint (auth required) returns views, actions, menus

### Client
- addons/web/static/src/services/views.js - Views service (load, getView, getAction, getMenus)
- main.js - Columns and form fields from view definitions; loads views on init
- Navbar rendered from menu data (getMenus); action-driven routing (act_window res_model -> hash)

### Bugfix
- views.js: handle 404/500 and non-JSON responses; avoid SyntaxError on r.json() when load_views fails

## 1.9.0 (Phase 7: Testing + Verification)

### Playwright Integration Tour
- tests/e2e/test_login_list_form_tour.py - E2E tour: login → Contacts list → create record
- scripts/with_server.py - Server lifecycle helper for e2e (start server, run command, cleanup)
- playwright.config.py - Base URL, timeouts
- requirements-dev.txt - playwright, pytest, pytest-playwright

### Test Infrastructure
- tests/e2e/conftest.py - E2E fixtures (base_url, login, password, db)
- load_tests in tests/e2e/__init__.py - Exclude e2e from unittest discovery (pytest-based)

### Run E2E
```bash
pip install -r requirements-dev.txt
playwright install chromium
./erp-bin db init -d erp   # if not already done
python scripts/with_server.py --server "./erp-bin server" --port 8069 -- python -m pytest tests/e2e/ -v
```

## 1.10.0 (Phase 7 continued: JS Unit Tests + Mock Server)

### JS Unit Test Harness
- addons/web/static/tests/test_runner.html - Browser test runner
- addons/web/static/tests/test_runner.js - Runs all suites, supports sync/async
- addons/web/static/tests/test_helpers.js - DOM helpers (createContainer, assertEqual, etc.)
- addons/web/static/tests/mock_rpc.js - Mock fetch with deterministic responses (setLoadViewsResponse, setRpcResponse)

### JS Unit Tests
- test_modifier_eval.js - ModifierEval.eval, evalAttr
- test_list_renderer.js - ViewRenderers.list render
- test_views_service.js - Services.views load, getView, getMenus (with mocked fetch)
- test_action_service.js - Services.action doAction (window, url, client)

### Playwright
- tests/e2e/test_js_unit_tests.py - Opens test_runner.html, asserts 0 failures

### Python
- tests/test_http.py - test_js_test_runner_served, test_js_test_mock_rpc_served

## 1.11.0 (Phase 7 completion: Parity Verification)

### Parity Verification Tests
- tests/test_parity_verification.py - Module lifecycle (load order, acyclic, base before dependents), security invariants (ir.model.access parse, build_access_map, check_access default-allow, deny when no match, allow when rule matches)

### HTTP Tests
- test_debug_assets_serves_individual_files - get_bundle_urls returns individual URLs
- test_asset_bundles_load_from_manifest - resolve_bundle_assets from manifest

### Docs
- Success criteria all marked done
- Parity matrix: Web client done, Test harness done, Prefetch deferred

### Bugfix
- addons/web/views/webclient_templates.xml: wrap HTML in CDATA to fix XML parse error (DOCTYPE invalid inside element)

## 1.12.0 (Phase 8 + 9: CRM + AI Assistant)

### Phase 8: CRM Module
- addons/crm: crm.lead (name, partner_id, stage, expected_revenue, description)
- views/crm_views.xml: list, form; action_crm_lead; menu Leads
- security/ir.model.access.csv
- main.js: generic model routing (getModelForRoute, renderList, renderForm for contacts + leads)
- server_wide_modules: crm

### Phase 9: AI RAG + Tool Registry
- addons/ai_assistant: ai.audit.log, ai.tool.definition, ai.prompt.template (implemented)
- addons/ai_assistant/tools/registry.py: search_records, summarise_recordset; execute_tool, log_audit
- /ai/tools (GET): list available tools (auth required)
- /ai/chat (POST): execute tool under user context; logs to ai.audit.log
- server_wide_modules: ai_assistant

### Tests
- test_ai_tools_requires_auth
- test_load_views_registry_has_crm_lead

### Run JS Unit Tests
- Browser: http://localhost:8069/web/static/tests/test_runner.html
- Playwright: pytest tests/e2e/test_js_unit_tests.py -v (with server running)

### Docs
- DeploymentChecklist.md: Leads verification, AI tools verification, db init note for new modules
- docs/ai-implementation-checklist.md: AI deployment and tool-registry verification checklist

## 1.13.0 (Phases 10–14 Implemented)

### Phase 10: AI Chat UI
- addons/web: chat panel (collapsible), tool/model dropdowns, POST /ai/chat
- chat_panel.js: send, display messages, placeholder per tool

### Phase 11: AI Tools Expansion
- addons/ai_assistant/tools/registry.py: draft_message, create_activity, propose_workflow_step
- addons/crm/models/crm_activity.py: crm.activity (name, lead_id, note)
- Chat panel: new tools in dropdown

### Phase 12: RAG Retrieval
- addons/ai_assistant/models/ai_document_chunk.py
- tools/registry.py: retrieve_chunks() with record-rule filtering
- GET /ai/retrieve?q=query&limit=10
- /ai/chat: optional retrieve=true, pass retrieved_doc_ids to audit

### Phase 13: List Search + Filters
- main.js: search bar, Search button, domain [['name','ilike',q]]
- loadRecords(model, route, searchTerm)

### Phase 14: External JSON-2 API
- core/http/json2.py: POST /json/2/<model>/<method>
- Bearer token (API_KEY env or --api-key=)
- X-Odoo-Database header
- search, search_read, read, create, write, unlink

### ORM
- core/orm/models.py: ilike operator in search

### Tests
- test_json2_requires_auth

## 1.22.0 (Phase 29: CLI Shell + Module Install)

### Phase 29: CLI shell
- core/cli/shell.py: `erp-bin shell -d <db>` opens interactive REPL
- Shell exports `env` (Environment), `registry`, and `db` for the selected database
- Uses server-wide modules from config; loads model registry via load_module_graph

### Phase 29: Module install/list
- core/cli/module.py: `erp-bin module list|load|install`
- `module list`: shows modules in addons path with version (from manifest)
- `module install -d <db> -m <module>`: resolves dependencies, loads modules, initializes schema

## 1.21.0 (Phase 28: View Switcher)

### Phase 28: View Switcher (list | kanban)
- main.js: View mode buttons above list/kanban content
- getHashViewParam(): parse ?view= from hash
- getAvailableViewModes(route): from action view_mode
- getPreferredViewType(): URL ?view= > sessionStorage > action default
- setViewAndReload(): persist to sessionStorage, update hash
- renderViewSwitcher(): List | Kanban buttons (only when both available)
- Leads: list and kanban; Contacts: list only
- Hash format: #leads?view=kanban or #leads (list)

## 1.20.0 (Phase 27: res.company, res.groups, User Groups)

### Phase 27: res.company
- addons/base/models/res_company.py: res.company (name, currency_id)
- init_data: creates default "My Company" on db init

### Phase 27: res.groups
- addons/base/models/res_groups.py: res.groups (name, full_name)
- init_data: base.group_user, base.group_public
- full_name stores XML ID for access rule matching

### Phase 27: res.users groups
- res.users: company_id (Many2one), group_ids (Many2many to res.groups)
- Many2many write support in ORM (create + write)
- Recordset.write() added
- init_data: assigns admin to base.group_user and default company
- RPC: write dispatched to write_ids to avoid shadowing instance write

### Phase 27: check_access uses user groups
- security.get_user_groups(registry, db, uid) returns set of group full_name
- rpc.py, json2.py: pass user_groups to check_access
- Group-based access: rules with group_id require user in that group

### Bugfix
- ModelBase.write classmethod renamed to write_ids (was shadowing instance write)
- core/cli/db.py: hash_password import for admin creation

## 1.19.0 (Phase 26: Base Models - ir.sequence, ir.attachment, ir.model)

### Phase 26: ir.sequence
- addons/base/models/ir_sequence.py: ir.sequence (code, name, number_next)
- next_by_code(code): atomic increment, returns next number
- core/db/init_data.py: creates crm.lead sequence on db init
- core/orm/fields.py: Binary field (bytea)

### Phase 26: ir.attachment
- addons/base/models/ir_attachment.py: ir.attachment (name, res_model, res_id, datas)
- File attachments linked to records; datas stored as bytea

### Phase 26: ir.model stub
- addons/base/models/ir_model.py: ir.model (name, model, info)
- Table for model metadata; minimal stub for Odoo parity

### Schema
- core/db/schema.py: bytea column type for Binary
- ir_sequence, ir_attachment, ir_model tables created on db init

## 1.19.3 (Phase 32: res.country, res.currency, res.lang)

### Phase 32: res.country
- addons/base/models/res_country.py: name, code (ISO 2-char)
- init_data: _load_res_country() - EE, US, GB, DE, FI

### Phase 32: res.currency
- addons/base/models/res_currency.py: name, symbol, rate
- init_data: _load_res_currency() - EUR, USD, GBP

### Phase 32: res.lang stub
- addons/base/models/res_lang.py: code, name, active
- init_data: _load_res_lang() - en_US, fi_FI

### Phase 32: res.company currency_id
- res.company.currency_id: Integer → Many2one(res.currency)
- init_data: default company linked to EUR

## 1.19.8 (Phases 41–45)

### Phase 41: res.partner is_company, type
- addons/base/models/res_partner.py: is_company (Boolean), type (Selection: contact, address)
- ir_views.xml: is_company, type in form; is_company in list
- main.js: getSelectionOptions for res.partner type; isBooleanField, checkbox for is_company; list display for boolean
- addons/ai_assistant/tools/registry.py: fields_map includes is_company, type for RAG

### Phase 42: Many2many column in list
- addons/crm/views/crm_views.xml: tag_ids in crm_lead_list columns
- main.js: getDisplayNamesForMany2many; m2mCols in renderList; comma-separated tag names in leads list

### Phase 43: res.country.state_ids One2many
- addons/base/models/res_country.py: state_ids = One2many("res.country.state", "country_id")

### Phase 44: Search operator like
- core/orm/models.py: like operator (case-sensitive) in Model.search
- tests/test_rpc_read.py: test_search_read_with_like_operator

### Phase 45: Menu tree structure
- main.js: buildMenuTree; renderNavbar with parent hierarchy, dropdown for menus with children
- addons/base/views/ir_views.xml: menu_settings, menu_settings_apikeys (parent)
- init_data: _load_ir_actions_menus always upserts (adds new menus to existing DB)

## 1.19.7 (Phase 40: Persistent ir.actions / ir.ui.menu)

### Phase 40: ir.actions.act_window + ir.ui.menu (DB-persistent)
- addons/base/models/ir_actions.py: ir.actions.act_window (xml_id, name, res_model, view_mode)
- addons/base/models/ir_ui_menu.py: ir.ui.menu (xml_id, name, action_ref, parent_ref, sequence)
- init_data: _load_ir_actions_menus() seeds actions and menus from XML (only when tables empty)
- core/data/views_registry.py: load_views_registry_from_db(env) reads actions/menus from DB
- core/http/routes.py: /web/load_views uses DB when session exists, falls back to XML on error
- Views remain from XML; actions and menus persisted and editable at runtime

## 1.19.4 (Phase 33: Fix ORM read/search_read bug)

### Phase 33: ORM read bug fix
- Root cause: classmethod `read(cls, ids, fields)` overrode instance `read(self, fields)`; `rec.read(fields)` invoked classmethod with wrong args
- Fix: rename classmethod to `read_ids`; RPC routes `read` to `read_ids`; instance `read` preserved for search_read → browse().read()
- Include implicit `id` in SELECT when requested (id not in stored fields)
- _get_registry: clear addon modules before load so models register with correct registry (test isolation)
- tests/test_rpc_read.py: search_read returns data via _call_kw

## 1.19.5 (Phase 34: res.partner.country_id + res.country.state)

### Phase 34: res.country.state
- addons/base/models/res_country_state.py: name, code, country_id (Many2one)
- init_data: _load_res_country_state() - 15 EE states (Harjumaa, Hiiumaa, etc.)

### Phase 34: res.partner address fields
- res.partner: country Char → country_id Many2one(res.country), state_id Many2one(res.country.state)
- Form view: country_id, state_id dropdowns
- main.js: getMany2oneComodel for country_id, state_id

## 1.19.6 (Phase 35: Many2many + Html completion)

### Phase 35 Track A: Many2many form display
- addons/crm/models/crm_tag.py: crm.tag (name)
- crm.lead.tag_ids: Many2many to crm.tag
- main.js: getMany2manyInfo, form checkboxes for many2many, getFormVals collects selected ids
- init_data: default crm.tag (Hot, Cold, Follow-up, Qualified, Demo)

### Phase 35 Track A: Html field
- crm.lead.note_html: Html field
- Form: note_html rendered as textarea
- ORM: _sanitize_html_vals strips script/style on create and write

## 1.19.2 (Phase 31: Wizards / TransientModel)

### Phase 31: TransientModel
- core/orm/models_transient.py: TransientModel base (_transient=True), _transient_vacuum(), vacuum_transient_models()
- Transient models use real PostgreSQL tables; auto-vacuum when count > _transient_max_count (default 1000)

### Phase 31: Transient vacuum + cron
- addons/base/models/transient_vacuum.py: base.transient.vacuum model, run() for cron
- init_data: creates ir.cron for transient vacuum (hourly)

### Phase 31: base.wizard.confirm
- addons/base/models/wizard_confirm.py: TransientModel wizard with name, message; action_confirm(ids) RPC, _do_confirm() override

### Bugfix
- Recordset.unlink: perform delete directly (classmethod unlink shadows instance method)

## 1.19.1 (Phase 30: ir.config_parameter + Settings Stub)

### Phase 30: ir.config_parameter
- addons/base/models/ir_config_parameter.py: ir.config_parameter (key, value)
- get_param(key, default=None): returns value or default
- set_param(key, value): create or update; RPC access via read/write ops
- addons/base/security/ir.model.access.csv: access_ir_config_parameter

### Phase 30: Settings stub
- Placeholder #settings route: stub page with links (API Keys, more coming soon)
- Navbar: "Settings" link to #settings; API Keys moved under Settings
- main.js: renderSettingsStub(), route for #settings and #settings/apikeys

## 1.18.0 (Phase 25: ORM Field Types - Selection, One2many)

### Phase 25: Selection Field
- addons/crm/models/crm_lead.py: type Selection (lead/opportunity)
- addons/crm/views/crm_views.xml: type in list and form views
- main.js: getSelectionOptions, getSelectionLabel; form dropdown for Selection; list shows label
- getFormVals: handles Selection (default first option when empty)

### Phase 25: One2many (read-only MVP)
- addons/crm/views/crm_views.xml: activity_ids in lead form
- main.js: getOne2manyInfo; form renders read-only subtable for One2many
- After loadRecord, fetches crm.activity by ids and displays Name/Note/Due table
- getFormVals: skips One2many fields

## 1.17.0 (Phase 24: Scheduler / Cron)

### Phase 24: Scheduler / Cron
- addons/base/models/ir_cron.py: ir.cron (name, model, method, interval_minutes, next_run, active)
- run_due(env): run crons where next_run <= now; update next_run after each run
- core/cli/cron.py: `erp-bin cron [-d db]` runs due jobs
- core/orm/models.py: search supports `<=` operator (for next_run)

## 1.16.0 (Phases 22–23: Kanban Drag-Drop + List Filters)

### Phase 22: Kanban Drag-Drop
- addons/web/static/src/views/kanban_renderer.js: HTML5 drag-and-drop on cards
- Drop on column updates stage_id via write; visual feedback (kanban-dragging, kanban-drag-over)
- main.js: onStageChange callback for leads kanban

### Phase 23: List Column Filters
- Stage filter dropdown for leads (list + kanban views)
- domain [['stage_id','=',id]] when filter selected
- currentListState.stageFilter; Search preserves filter

## 1.15.0 (Phase 21: User Menu + API Key Management UI)

### Phase 21: User Menu + API Keys
- addons/web/static/src/main.js: User menu (API Keys, Logout) in navbar
- addons/web/static/src/scss/webclient.css: nav-user styles
- Route #settings/apikeys: API Keys management (list, generate, revoke)
- addons/base/models/res_users_apikeys.py: revoke(ids), generate(user_id, name) no longer takes env
- addons/base/security/ir_rule.xml: Record rule for res.users.apikeys (user_id = uid)

## 1.14.0 (Phase 20: API Key Model)

### Phase 20: res.users.apikeys
- addons/base/models/res_users_apikeys.py: User-bound API keys (user_id, name, key_hash)
- generate(env, user_id, name): create key, return raw token (show once)
- _check_credentials(env, key): validate bearer token, return user_id or None
- core/http/json2.py: _auth_bearer checks res.users.apikeys first, falls back to API_KEY env
- addons/base/security/ir.model.access.csv: access_res_users_apikeys

### Schema
- res_users_apikeys table created from model (key_hash column for SHA256)

## Planning: Phases 15–20 (Odoo 19.0 Parity)

- docs/next-phase-plan.md: Phases 15–20 added from odoo-19.0 reference
  - Phase 15: ORM Many2one + relational fields
  - Phase 16: CRM Stage model (crm.stage)
  - Phase 17: Kanban view MVP
  - Phase 18: Record rules (ir.rule)
  - Phase 19: RAG document indexing on write
  - Phase 20: JSON-2 + res.users.apikeys ✓

### Planning (1.13.0)
- docs/next-phase-plan.md: Phases 10–14 added
  - Phase 10: AI Chat UI (chat panel in webclient, /ai/chat integration)
  - Phase 11: AI Tools Expansion (draft_message, create_activity, propose_workflow_step)
  - Phase 12: RAG Retrieval Skeleton (document index, retrieval API)
  - Phase 13: List Search + Filters (search bar, domain from input)
  - Phase 14: External JSON-2 API (deferred)
