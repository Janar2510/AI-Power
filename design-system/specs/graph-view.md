# Graph view (analytics chart)

## Scope

- **Phase 609:** Legacy graph fallback in `main.js` delegates toolbar HTML to **`AppCore.GraphViewChrome.buildToolbarHtml`** when the concat / bundled runtime registers it (`app/graph_view_chrome.js`).
- Toolbar uses **CSS custom properties** only (see `webclient.css`: `.o-graph-toolbar-chrome`, `.o-graph-type-btn`, `.o-graph-search-field`, `.o-graph-container`).

## Behaviour

- View switcher, chart type toggles (**bar** / **line** / **pie**), search field, optional CRM stage filter, and add button share list-toolbar spacing tokens (`--card-gap`, `--space-*`).
- Chart rendering remains **Chart.js** on `#graph-canvas` inside `.o-graph-container`; dataset colours may still use chart-library RGBA until a dedicated theming pass.

## Acceptance

- With `AppCore.GraphViewChrome` present, graph toolbar has **no hardcoded hex** borders/backgrounds on type buttons (tokens only).
- Fallback path in `main.js` remains if chrome is absent (legacy inline styles).
