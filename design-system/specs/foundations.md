# Foundations Specification

## Purpose

This is the global design foundation for Foundry One. All shell, dashboard, list, form, kanban, settings, dialog, and utility specs inherit these rules before defining surface-specific behavior.

## Brand and Experience

- Working product brand: **Foundry One**
- Product type: AI-powered modular ERP
- Style: subtle professional skeuomorphism
- Character: industrial executive
- Experience goal: premium operational software with tactile depth, calm density, and long-session clarity

## Typography

- Use a structured three-tier type system:
  - **Display:** shell brand, section heroes, major KPI values
  - **UI Sans:** navigation, labels, forms, tables, controls
  - **Mono / tabular numeric:** codes, references, counts, dates, currencies, audit and debug surfaces
- Numeric-heavy ERP surfaces should default to tabular figures.
- Headings must feel controlled and architectural, not editorial.
- Labels and meta text should prioritize scan speed over stylistic flourish.
- Avoid oversized marketing-style hero copy inside core product workflows.

## Color System

- Use semantic token families rather than feature-local palettes:
  - shell
  - background
  - surface
  - panel
  - field inset
  - border
  - text
  - primary
  - accent
  - success
  - warning
  - danger
  - info
- Light mode should read as engineered paper and satin composite.
- Dark mode should read as smoked metal and illuminated instrumentation.
- Module accents are secondary; the master shell palette remains dominant.
- Status color usage must stay consistent between list rows, chips, badges, kanban states, and dashboard alerts.

## Materials and Depth

- Use restrained tactile cues:
  - raised primary actions
  - inset fields
  - glass command surfaces
  - layered panels
  - precise border sheen
  - controlled shadow and inner shadow
- Do not use exaggerated retro skeuomorphic tropes.
- Depth should communicate hierarchy, interactivity, and containment.

## Motion

- Motion must support orientation and state change, not decoration.
- Use the existing motion token family for:
  - route/view transitions
  - hover lift
  - pressed-state response
  - drawer and modal entry
  - drag feedback
  - loading shimmer
- Reduced motion mode must preserve clarity through contrast and depth even when animation is minimized.

## Behaviors

- Hover: subtle lift, glow, or contrast increase on actionable surfaces
- Active: stronger contrast, pressed or inset feedback, clearer edge definition
- Focus: tokenized focus ring plus local contrast change where useful
- Selected: visible state that does not rely on color alone
- Disabled: lower prominence without becoming illegible
- Loading: skeleton or placeholder surfaces should match material hierarchy
- Error / warning / success: semantic treatment must remain consistent across all views

## Minimum Element Inventory

Every implementation phase should treat these as first-class design system elements:

- App shell
- Sidebar
- Navbar
- Breadcrumbs
- Search and command surfaces
- Buttons
- Inputs
- Textareas
- Selects
- Toggles
- Chips and facets
- Tabs and segmented controls
- Cards and sheets
- Tables
- Pagination
- KPI tiles
- Status badges
- Dialogs
- Drawers
- Toasts
- Empty states
- Skeletons
- Attachments and report previews

## Responsive Rules

- `1023px`: compact shell, preserve hierarchy, reduce horizontal spread
- `768px`: stack controls and favor overlay navigation patterns
- `480px`: simplify spacing and decorative depth while keeping material identity

## Accessibility

- Preserve `:focus-visible`.
- Maintain contrast at or above project targets.
- Provide keyboard access for shell, data, and modal surfaces.
- Ensure icon-only controls have text alternatives.
- Do not use motion as the only state indicator.

## Implementation Guardrails

- New implementation work should prefer class-based styling over inline visual `style=` usage.
- Specs must reference token names or classes, not raw colors.
- Surface-specific specs should add detail, not redefine the foundations.
