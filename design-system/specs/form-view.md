# Form View Spec

Inherits [foundations.md](./foundations.md) and [app-shell.md](./app-shell.md).

## Goals
- Preserve Odoo-style form workflows with premium UX polish.
- Keep metadata-driven rendering and existing public routes/RPC contracts.

## Layout
- Use `.o-form-header`, `.o-form-sheet`, `.o-button-box`.
- Keep horizontal rhythm with `--card-gap` and spacing with `--space-*`.
- Render optional right sidebar for AI/auxiliary blocks.
- Form sheets should feel like the primary crafted work surface within the app shell.

## Controls
- Primary save action uses `.o-btn.o-btn-primary`.
- Secondary actions use `.o-btn.o-btn-secondary`.
- Keyboard hints use `data-shortcut` and `title` affordance.

## States
- Dirty state banner uses `.form-dirty-banner`.
- Loading placeholders use `AppCore.Helpers.renderSkeletonHtml`.
- No-data panes use `UIComponents.EmptyState`.

## Attachments and reports
- Image previews may open `UIComponents.AttachmentViewer`.
- Report preview uses `UIComponents.PdfViewer` with `/report/pdf/...`.

## Accessibility
- Focus-visible ring must be preserved.
- Escape should close topmost preview modal.
- Reduced-motion users should not get forced transitions/animations.
