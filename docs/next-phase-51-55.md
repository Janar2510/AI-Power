# Next Implementation Phase (51–55)

**Context:** Phases 46–50 complete. Reference: [odoo_repo_map.md](odoo_repo_map.md), [next-phase-plan.md](next-phase-plan.md), [parity_matrix.md](parity_matrix.md). Gap analysis: erp-platform vs Odoo 19.0.

---

## Gap Analysis (Post Phase 50)

| Area | Odoo 19.0 | erp-platform | Gap |
|------|-----------|---------------|-----|
| Action context/domain | act_window context, domain | Not passed to frontend | Phase 51 |
| Search view | &lt;search&gt; with filter/group fields | Free-text search only | Phase 52 |
| Saved filters | ir.filters or client saved domains | None | Phase 53 |
| Computed fields | compute=, store=True | No computed fields | Phase 54 |
| Binary / file | Binary field, ir.attachment datas | Text/HTML only | Phase 55 |

---

## Phase 51: Action context and domain

**Odoo reference:** `ir.actions.act_window` has `context` (dict) and `domain` (list); applied when opening the view.

| Task | Implementation |
|------|----------------|
| ir.actions.act_window | Add `context` (Text/JSON), `domain` (Text) to model if not present |
| load_views / registry | Include context and domain in action payload to frontend |
| main.js | When opening list/form from action, apply action domain as default search domain; pass context to RPC when relevant |
| Default domain | List loads with `domain_from_action` merged with user search/filter |

**Files:** [addons/base/models/ir_actions.py](erp-platform/addons/base/models/ir_actions.py), [core/data/views_registry.py](erp-platform/core/data/views_registry.py), [addons/web/static/src/main.js](erp-platform/addons/web/static/src/main.js), [core/db/init_data.py](erp-platform/core/db/init_data.py) (seed context/domain from XML if needed).

**Scope:** MVP: domain only (list default filter). Context as optional JSON string for future use.

---

## Phase 52: Search view (filter fields from XML)

**Odoo reference:** View type `search` with `<field name="..."/>` defines searchable fields and filter/group by options.

| Task | Implementation |
|------|----------------|
| xml_loader | Parse `<search>` arch: list of `<field name="..."/>` as searchable fields |
| views_registry | When building view defs, include search view for model if present; structure e.g. `search_fields: ['name','email',...]` |
| main.js | Use search_fields from view (or fallback to name) to build domain: `['|',('name','ilike',q),('email','ilike',q),...]` for free-text search |
| Optional | Parse `<filter>` / `<group>` for later use (defer filter dropdowns from search view in this phase) |

**Files:** [core/data/xml_loader.py](erp-platform/core/data/xml_loader.py), [core/data/views_registry.py](erp-platform/core/data/views_registry.py), [addons/base/views/ir_views.xml](erp-platform/addons/base/views/ir_views.xml), [addons/crm/views/crm_views.xml](erp-platform/addons/crm/views/crm_views.xml), [addons/web/static/src/main.js](erp-platform/addons/web/static/src/main.js).

**Scope:** Search view defines which fields are used for the search bar; no saved filters or filter/group UI from search yet.

---

## Phase 53: Saved filters (client-side)

**Odoo reference:** User can save current search (name + domain); load_views or separate endpoint returns saved filters per model.

| Task | Implementation |
|------|----------------|
| Option A (client) | sessionStorage/localStorage: save current domain + label per model; dropdown "Saved filters" in list view |
| Option B (server) | ir.filters model (name, model_id, domain, user_id); RPC read; filter menu from DB |
| Recommendation | Phase 53: Option A (client-side only) to avoid new model; Option B in a later phase |
| main.js | "Save current search" → store domain + name; "Load" → apply domain; list state holds active_saved_filter_id |

**Files:** [addons/web/static/src/main.js](erp-platform/addons/web/static/src/main.js) (list toolbar, saved filter dropdown, load/save).

**Scope:** Client-side only; key e.g. `erp_saved_filters_{model}` in localStorage.

---

## Phase 54: Computed fields (stored)

**Odoo reference:** `fields.Computed(compute=..., store=True)`; computed on create/write and stored in DB.

| Task | Implementation |
|------|----------------|
| core/orm/fields | Add `Computed` field type: `compute` (callable name), `store=True`; no inverse in MVP |
| Model | On create/write, after saving stored fields, call compute method and write computed values to DB |
| Schema | Computed stored fields get a column like normal fields |
| Example | res.partner: display_name = computed from name (or leave for later); or crm.lead: stage_name = computed from stage_id.name (requires related) |

**Files:** [core/orm/fields.py](erp-platform/core/orm/fields.py), [core/orm/models.py](erp-platform/core/orm/models.py) (create/write trigger compute).

**Scope:** store=True only; no `related=` in this phase. One computed field per model for testing.

---

## Phase 55: Binary field and file upload

**Odoo reference:** `fields.Binary`, `ir.attachment` with `datas` (base64 or bytea).

| Task | Implementation |
|------|----------------|
| core/orm/fields | Add `Binary` field type; store as bytea in PostgreSQL |
| ir.attachment | Already have model; ensure `datas` stored as bytea; optional: store in ir.attachment by convention (res_model, res_id, name) |
| Form | For Binary field: file input; on save, read file as base64 or binary, send to backend; display link or thumbnail if present |
| main.js | Form field type "binary": &lt;input type="file"&gt;; getFormVals: read file, base64 encode, send in vals |

**Files:** [core/orm/fields.py](erp-platform/core/orm/fields.py), [core/db/schema.py](erp-platform/core/db/schema.py) (bytea column), [addons/base/models/ir_attachment.py](erp-platform/addons/base/models/ir_attachment.py), [addons/web/static/src/main.js](erp-platform/addons/web/static/src/main.js).

**Scope:** One Binary field on a model (e.g. ir.attachment.datas or a test model); form upload and display.

---

## Recommended order

1. **Phase 51** — Action domain (enables default list filter from action; small backend + frontend)
2. **Phase 52** — Search view fields (metadata-driven search bar)
3. **Phase 53** — Saved filters client-side (UX; no backend)
4. **Phase 54** — Computed stored fields (ORM extension)
5. **Phase 55** — Binary + file upload (enables attachments)

---

## Skills to apply

- **odoo-parity:** Action contract, search view structure, computed/related semantics
- **test-driven-development:** Tests for action domain, computed field write, binary read/write
- **verification-before-completion:** `python3 run_tests.py`, `./erp-bin db init`, manual list/form check

---

## Out of scope (deferred)

- View inheritance (xpath, position)
- Full i18n pipeline
- Server-side ir.filters (can add after Phase 53)
- Related fields (compute from relation)
- Calendar, graph, pivot views
