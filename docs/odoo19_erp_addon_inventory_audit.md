# Odoo 19.0 ↔ ERP platform — addon inventory audit

**Generated:** inventory diff of **module directories** (each folder with an app under `addons/`).  
**Odoo 19 path:** `odoo-19.0/addons/` (615 modules). *Core `base` lives under `odoo-19.0/odoo/addons/base` and is not in that count.*  
**ERP path:** `erp-platform/addons/` (393 top-level entries; includes non-module artefacts like `__pycache__` if present).

This audit answers: *which Odoo Enterprise/Community addon **names** exist upstream but not as an ERP folder*, and the reverse. It does **not** measure feature depth inside a module (a present `website` folder can still be shallow vs Odoo 19).

---

## Summary

| Metric | Value |
|--------|------:|
| Folders under Odoo `addons/` | 615 |
| Folders under ERP `addons/` | ~393 (clean module count lower if excluding `__pycache__` / stray files) |
| **In Odoo `addons/`, not in ERP** | **249** |
| **In ERP, not in Odoo `addons/`** | **27** (several are ERP-specific or live elsewhere in Odoo) |

Of the 249 “Odoo-only” names, **~157** are `l10n_*` (localisation / EDI / country POS bridges). **~17** are `test_*`. **~20** are extra `pos_*` payment or hardware integrations.

---

## Website / eCommerce (clarification)

| Question | Answer |
|----------|--------|
| Is there an `ecommerce` module in Odoo 19? | **No.** Shop functionality is **`website_sale`** (+ optional bridges). |
| Does ERP include `website` / `website_sale`? | **Yes** — both exist under `erp-platform/addons/`. |
| Why does the UI feel “missing Website/eCommerce”? | The **legacy web client** still uses **placeholder routes** for `website` / `ecommerce` slugs in `main.js` (see `docs/odoo19-webclient-gap-table.md`, **Views** / app-shell notes). That is **front-end wiring**, not absence of the backend addons. |

### `website_*` bridge modules

- **Odoo 19:** 55 `website_*` folders under `addons/`.
- **ERP:** 46 `website_*` folders.

**Present in Odoo 19 but not in ERP (9 names):**

- `website_crm_livechat`
- `website_google_map`
- `website_hr_recruitment_livechat`
- `website_mass_mailing`
- `website_mass_mailing_sms`
- `website_sale_mass_mailing`
- `website_sale_slides`
- `website_slides_forum`
- `website_slides_survey`

Several of these are explicitly **deferred** at product level (`docs/deferred_product_backlog.md`: mass mailing depth, livechat, etc.).

---

## ERP-only names (not under Odoo `addons/`)

These appear under `erp-platform/addons/` but **not** as a sibling of the same name in `odoo-19.0/addons/`:

| Module | Note |
|--------|------|
| `ai_assistant` | ERP product feature |
| `base` | Odoo **`base`** is under `odoo/addons/base`, not `addons/` — naming match is misleading in a flat diff |
| `demo_module`, `my_module` | Local / demo scaffolding |
| `fetchmail` | May differ from Odoo packaging (`fetchmail` in Odoo can live under different tree in some editions) |
| `google_drive` | Odoo 19 may use different split (`google_*` set differs) |
| `helpdesk`, `knowledge`, `quality` | ERP apps; Odoo uses different module names or enterprise bundles |
| `hr_contract`, `hr_payroll` | Often enterprise / separate in Odoo |
| `inter_company_rules` | ERP naming for inter-company flows |
| `iot` | Odoo uses `iot_*` variants (`iot_base`, …) in `addons/` |
| `l10n_generic_coa`, `l10n_sg_full` | ERP localisation packaging |
| `mailing` | ERP; Odoo uses `mass_mailing` |
| `pos` | Odoo POS is split across many `pos_*` modules; no single `pos` folder in community `addons/` |
| `sale_subscription` | Often enterprise in Odoo |
| `spreadsheet_crm`, `spreadsheet_dashboard_crm` | ERP naming vs Odoo `spreadsheet*` + `crm` bridges |
| `stock_barcode` | Exists in Odoo under different naming in some trees — verify per checkout |
| `theme_starter_*` | ERP theme stubs |

Treat this list as **“no 1:1 folder in `odoo-19.0/addons/`”**, not as “Odoo has no equivalent feature.”

---

## Odoo-only buckets (high level)

1. **`l10n_*` (~157)** — Country taxes, EDI, e-invoicing, OSS, DIN5008, etc. Aligns with **deferred l10n** in `deferred_product_backlog.md`.
2. **`pos_*` payment / hardware (~20+)** — Adyen/Mollie/Razorpay self-order variants, regional terminals, etc.
3. **`test_*` (~17)** — Odoo QA modules; not required in ERP product addons path.
4. **Google / cloud / IoT splits** — e.g. `cloud_storage_google`, `google_gmail`, `iot_drivers`; ERP may have fewer or consolidated modules.
5. **Website bridges** — listed above (9).

Full raw list (249 names) can be regenerated with **`scripts/diff_odoo_erp_addons.sh`** (Phase **667**):

```bash
# From erp-platform/ (default Odoo path: ../odoo-19.0/addons)
bash scripts/diff_odoo_erp_addons.sh
# Optional snapshot:
ODOO19_ADDONS=/path/to/odoo-19.0/addons bash scripts/diff_odoo_erp_addons.sh /tmp/addon-diff.txt
# Phase 678: fail if core addon folders are missing from erp-platform/addons/ (CI opt-in):
ERP_DIFF_REQUIRE_CORE=1 ODOO19_ADDONS=/path/to/odoo-19.0/addons bash scripts/diff_odoo_erp_addons.sh
# CI (Phase 684D): same directory for Odoo and ERP paths — diff output empty but core-folder guard still runs:
# ERP_DIFF_REQUIRE_CORE=1 ODOO19_ADDONS="$GITHUB_WORKSPACE/addons" bash scripts/diff_odoo_erp_addons.sh
```

Equivalent one-liners:

```bash
ls -1 odoo-19.0/addons | sort > /tmp/odoo19_addons.txt
ls -1 erp-platform/addons | sort > /tmp/erp_addons.txt
comm -23 /tmp/odoo19_addons.txt /tmp/erp_addons.txt   # Odoo only
comm -13 /tmp/odoo19_addons.txt /tmp/erp_addons.txt   # ERP only
```

---

## Relation to other docs

| Doc | Role |
|-----|------|
| `docs/deferred_product_backlog.md` | Product rule: no deep l10n / mass mailing / livechat / spreadsheets without scope |
| `docs/odoo19-webclient-gap-table.md` | **Web client** parity vs Odoo 19 **UI** (Website tile → placeholder is here) |
| `docs/odoo19_reference_map.md` | Where to read Odoo 19 **source** for clean-room parity |
| `docs/account_odoo19_gap_audit.md` / `docs/stock_odoo19_gap_audit.md` | Deep **behaviour** gaps in account/stock |

---

## Suggested next steps (product + engineering)

1. **Separate “addon missing” from “client not wired”** for Website/eCommerce: track web-client phases until `website` / shop routes leave `main.js` placeholders.
2. **Prioritise** missing `website_*` bridges only if product enables mass mailing / livechat / academy stacks; otherwise keep deferred.
3. **Localisation:** treat the 157 `l10n_*` delta as a **programme**, not a single phase; clone subsets per country when needed.
4. **POS:** add payment/provider modules only when target markets require them; avoid importing all 20+ Odoo-only `pos_*` names.
5. Re-run this inventory after **major merges** from Odoo or when adding ERP apps (update counts in this file).

---

## Appendix — full “Odoo addons only” list (249)

<!-- Regenerate with comm -23 as above; too long to freeze in git — run script to refresh -->

The authoritative list is the output of:

`comm -23 <(ls -1 odoo-19.0/addons | sort) <(ls -1 erp-platform/addons | sort)`

Store a snapshot in CI or `scripts/` if you need a diff gate.
