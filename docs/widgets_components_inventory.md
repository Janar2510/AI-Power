# Widgets and shell components inventory (Phase 802)

**Manifest:** [`addons/web/__manifest__.py`](../addons/web/__manifest__.py) **`web.assets_web`**

## Field widgets (`addons/web/static/src/widgets/`)

| File | Role |
|------|------|
| `date_widget.js` | Date / datetime inputs |
| `many2one_widget.js` | M2O search/create |
| `many2many_widget.js` | M2M tags |
| `monetary_widget.js` | Currency amounts |
| `html_widget.js` | HTML fields |
| `binary_widget.js` | File / binary |

## Components (`addons/web/static/src/components/`)

Includes: `button`, `card`, `badge`, `avatar`, `modal`, `toast`, `kpi_card`, `activity_feed`, `control_panel`, `form_field`, `breadcrumbs`, `confirm_dialog`, `search_panel`, etc. (see manifest list).

## Checklist alignment (phases 366–377)

The **`ai-implementation-checklist`** rows for “implement widgets/components” refer to expanding **coverage** and **parity** with Odoo-style APIs — the scaffold files above exist; extend behaviour per feature with tests rather than re-adding empty files.
