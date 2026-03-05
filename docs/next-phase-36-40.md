# Next Implementation Phase (36–40)

**Context:** Phases 33–35 complete. Reference: [odoo_repo_map.md](odoo_repo_map.md), [next-phase-plan.md](next-phase-plan.md), Odoo 19.0 at `odoo-19.0/`.

---

## Gap Analysis (Odoo 19.0 vs erp-platform)

| Area | Odoo 19.0 | erp-platform | Gap |
|------|-----------|--------------|-----|
| res.partner address | street, street2, zip, city, state_id, country_id | street, city, country_id, state_id | Missing: street2, zip |
| res.country | state_ids One2many | — | Optional reverse relation |
| List view | Many2one/M2m columns resolve display | Many2one via getDisplayNames | M2m tags, country/state in list |
| Form field metadata | From view XML (domain, comodel) | Hardcoded getMany2oneComodel, getMany2manyInfo | No domain; state not filtered by country |
| ir.actions / ir.ui.menu | ORM models, DB-persistent | XML → in-memory registry | No runtime edit |
| Search operators | =, !=, <, >, in, like, ilike, child_of | =, !=, <=, ilike | Missing: in, not in, <, >, >= |
| RAG indexing | — | ai.document.chunk exists | Index on write for partner/lead |
| res.partner | is_company, type (contact/address) | — | Deferred |

---

## Phase 36: res.partner Address Completion + List Display

**Odoo reference:** `odoo/addons/base/models/res_partner.py` (ADDRESS_FIELDS: street, street2, zip, city, state_id, country_id).

| Task | Implementation |
|------|----------------|
| res.partner | Add `street2`, `zip` (Char) |
| List columns | Add country_id, state_id to res.partner list view |
| getDisplayNames | Ensure list uses read_ids for Many2one (already via RPC) |
| List M2m | Display tag_ids as comma-separated names in leads list (optional) |

**Files:** `addons/base/models/res_partner.py`, `addons/base/views/ir_views.xml`, `addons/web/static/src/main.js` (getListColumns fallback if needed).

---

## Phase 37: State Dropdown Domain (country_id → state_id)

**Odoo reference:** state_id dropdown filtered by `[('country_id','=',country_id)]`.

| Task | Implementation |
|------|----------------|
| data-domain on select | Add `data-domain` attribute for state_id: `[['country_id','=',country_id]]` |
| loadOptions | For selects with data-domain, pass domain to search_read |
| Country change handler | On country_id change, reload state_id options and clear selection |

**Files:** `addons/web/static/src/main.js` (renderForm, loadOptions, getMany2oneDomain or similar).

**Scope:** res.partner form only; state options filtered by selected country.

---

## Phase 38: Search Operators (in, not in, <, >, >=)

**Odoo reference:** `odoo/orm/` domain evaluation; standard ops.

| Task | Implementation |
|------|----------------|
| Model.search | Add `in`, `not in`, `<`, `>`, `>=` to WHERE builder |
| Tests | test_orm.py: search with `('id','in',[1,2,3])`, `('id','>',5)` |

**Files:** `core/orm/models.py` (search method).

---

## Phase 39: RAG Index on Write

**Odoo reference:** N/A (custom).

| Task | Implementation |
|------|----------------|
| index_record_for_rag | Called on res.partner, crm.lead create/write (already in rpc.py for create/write) |
| Verify | Ensure chunks created; retrieve returns results for new/updated records |

**Files:** `core/http/rpc.py` (already has index_record_for_rag for create/write), `addons/ai_assistant/tools/registry.py`.

**Note:** May already be wired; verify and document.

---

## Phase 40: Persistent ir.actions / ir.ui.menu (Track B)

**Odoo reference:** `odoo/addons/base/models/ir_actions.py`, `ir_ui_menu.py` — ORM models loaded from XML into DB.

| Task | Implementation |
|------|----------------|
| ir.actions.act_window | ORM model: name, res_model, view_mode, type |
| ir.ui.menu | ORM model: name, action (FK or ref), parent_id, sequence |
| Data loading | On module load / db init, upsert actions/menus from XML into DB |
| views_registry | Read actions/menus from DB (or hybrid: XML seed → DB read) |
| Deferred | Full menu tree, group-based visibility |

**Files:** `addons/base/models/ir_actions.py`, `ir_ui_menu.py`, `core/db/init_data.py` or data loader, `core/data/views_registry.py`.

---

## Recommended Order

1. **Phase 36** — res.partner street2, zip; list country/state (low risk, high parity)
2. **Phase 37** — State domain (UX improvement)
3. **Phase 38** — Search operators (enables richer filters)
4. **Phase 39** — Verify RAG index on write (may be done)
5. **Phase 40** — Persistent actions/menus (larger change; enables runtime customization)

---

## Skills to Apply

- **odoo-parity:** Field naming, model structure
- **test-driven-development:** Tests for search operators
- **verification-before-completion:** Run `python3 run_tests.py`, `./erp-bin db init`, manual form test

---

## Phases 36–40 complete

- Phase 36: res.partner street2, zip; list country_id, state_id
- Phase 37: state_id domain by country_id
- Phase 38: search operators in, not in, <, >, >=
- Phase 39: RAG index on write verified
- Phase 40: ir.actions.act_window + ir.ui.menu persistent; /web/load_views from DB

## Deferred (Out of Scope)

- res.partner is_company, type (contact/address)
- Full i18n (.po load, translate)
- Model inheritance (_inherit, _inherits)
- res.country.state_ids One2many (optional cosmetic)
- Many2many column in list (comma-separated tags) — can add in Phase 36 if quick
