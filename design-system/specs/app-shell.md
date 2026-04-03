# App Shell Specification

## Goals

- Establish one authoritative shell contract for the ERP product.
- Make navigation, search, status, and auxiliary tools feel premium, tactile, and operationally clear.
- Preserve action-first workflows and the existing metadata-driven frontend architecture.

## Brand Context

- Product brand: **Foundry One**
- Style: subtle professional skeuomorphism
- Shell metaphor: precision-crafted cockpit

## Layout

- Root shell remains `#webclient.o-app-shell`.
- Sidebar remains the left structural rail; main content remains `.o-app-main-column`.
- Navbar becomes a distinct glass-and-metal command rail rather than a plain header row.
- Main content should sit on a quieter surface than shell chrome so forms, tables, and dashboards remain the focus.

## Sidebar

- Root: `.o-app-sidebar`
- Navigation groups: `.o-sidebar-category`, `.o-sidebar-subgroup`
- Links: `.o-sidebar-link`, `.o-sidebar-link--active`, `.o-sidebar-link--nested`
- Material behavior:
  - default state reads as structural shell
  - hover adds soft lift or inner glow
  - active uses stronger inset contrast, directional edge highlight, and clearer text weight
  - collapsed state must still feel intentional, not merely hidden
- Keep icons geometric and restrained; fallback abbreviations must still read as branded.

## Navbar

- Root container should use `.o-navbar-shell` and `.o-navbar-glass`.
- Include a branded zone, current-app context, global search / command affordance, utility actions, company/language/status controls, and account/logout.
- The theme toggle must evolve from utility icon treatment into part of a broader shell-control language.
- Dropdown surfaces should inherit shell material tokens and not rely on isolated inline colors.

## Breadcrumbs and Context

- Breadcrumbs must feel like structural wayfinding, not plain text links.
- Use `.o-breadcrumbs`, `.o-breadcrumbs-link`, `.o-breadcrumbs-current`.
- Current location must be visually distinct through weight and material contrast, not only color.

## Global Search and Command

- Search and command interactions should look like inset instruments rather than generic inputs.
- Use a shared field recipe for:
  - global search
  - command palette trigger
  - filter search
  - many2one search-style controls where appropriate
- Command palette panel should inherit the shell material family but with stronger depth for modal focus.

## Systray, Notifications, and Status

- Systray controls should use compact tactile chips rather than invisible text actions.
- Notifications should move toward a drawer/panel surface language, even if implementation starts with dropdowns.
- Count badges must use semantic tokens and remain readable in both themes.

## AI Entry Points

- AI assistant entry points should feel integrated into the shell, not bolted on.
- The shell-level AI trigger must visually harmonize with command/search tools while still remaining discoverable.
- AI panels and drawers should use the same overlay hierarchy as notifications and command surfaces.

## Loading and failure surfaces (post-1.250.8)

- Long-running view loads must not spin silently: use **token-based** messaging (`--text-muted`, `--border-color`) and a **primary Retry** action.
- OWL **list/form** paths use `__ERP_rpcRaceDeadline` (default **25s**) so hung RPC surfaces **Retry** instead of infinite “Loading…”.
- **ActionContainer** may show a **timeout** panel with **Retry** (full reload) when a `loading` signal never completes (**35s** watchdog).
- Inline help routes (e.g. `#keyboard-shortcuts`) use the same **empty-state** vocabulary as placeholders: title, muted body, primary CTA.

## Main Content Transition

- `#main` should feel like the working plane below the shell chrome.
- Content padding remains tokenized and consistent with current breakpoints.
- Route/view transitions should be short and structural, using existing motion tokens.

## Light Mode

- Overall impression: engineered paper, satin composite, daylight glass.
- Sidebar and navbar should feel slightly denser than content surfaces.
- Avoid flat white emptiness; use layered neutrals and restrained highlights.

## Dark Mode

- Overall impression: smoked metal, dark composite, illuminated instrumentation.
- Maintain hierarchy through surface separation, edge contrast, and legible text, not through saturated blue alone.
- Glass and shadow values should deepen without becoming muddy.

## Responsive Behavior

- `1023px`: shell condenses, mobile sidebar flow becomes primary secondary-nav pattern.
- `768px`: navbar utilities compress, sidebar becomes overlay, breadcrumbs/search must remain usable.
- `480px`: shell keeps tactile identity but simplifies ornamental depth and spacing.

## Accessibility

- Preserve keyboard access for sidebar links, shell toggles, dropdowns, notifications, and search surfaces.
- Use `aria-current` for active navigation.
- Icon-only shell controls must have clear `aria-label` values.
- Reduced-motion users must still receive clear state changes through contrast and depth.

## Implementation Notes

- All new shell styling must be token-driven.
- New work should reduce dependence on HTML-string inline styles in `main.js`.
- Shared shell classes should become the default path for navbar, dropdown, sidebar, and utility controls before broader view-surface refactors.
