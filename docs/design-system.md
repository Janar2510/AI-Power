# Design System v2

## Foundation
- Based on UI UX Pro Max skill recommendations
- Uses design tokens in `addons/web/static/src/scss/webclient.css`

## Components
- Button, Card, Badge, Avatar, Modal, Toast

## Implemented in Phases 366-373
- Components are now DOM-based factories (no HTML string stubs).
- Field widgets implement `render(container, fieldName, value, options)`.
- Layout modules render navbar, sidebar, and action layout shells.
- Calendar renderer supports day/week/month modes.
- Gantt renderer supports day/week/month scale switching.

## Implemented in Phases 378-381
- Frontend logic is split into `addons/web/static/src/core/` modules (`router`, `view_manager`, `dashboard`, `settings`, `chatter`, `field_utils`).
- UI/UX Designer and Frontend Builder can now target focused files instead of the monolithic `main.js`.
- This modularization improves maintainability while preserving CSS token usage and component patterns.

## Accessibility
- Focus-visible states
- Contrast target 4.5:1
- Reduced motion support
