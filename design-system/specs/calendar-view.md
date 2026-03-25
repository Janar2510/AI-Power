# Calendar view

## Scope

- **Phase 615:** Legacy calendar in `main.js` delegates the **toolbar** (view switcher, month navigation, search, add) to **`AppCore.CalendarViewChrome.buildToolbarHtml`** when registered (`app/calendar_view_chrome.js`).
- Month grid uses **token classes** (`.o-calendar-grid`, `.o-calendar-cell`, `.o-calendar-event-link`, etc.) in `webclient.css`; no hardcoded hex on toolbar buttons.

## Behaviour

- **`cal-title`** shows the current month label; **Prev / Next / Today** shift `loadRecords` via existing handlers.
- **`Add`** label: **`Add meeting`** when `model === calendar.event`, else the same route-based label pattern as list/graph (contact, lead, order, …).

## Acceptance

- With chrome loaded, toolbar matches **graph/pivot** spacing (`--card-gap`, `--space-*`).
- Fallback toolbar in `main.js` remains if `CalendarViewChrome` is absent.
