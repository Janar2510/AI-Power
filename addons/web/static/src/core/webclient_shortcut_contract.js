/**
 * Phase 600: Documented Alt+ shortcuts for the legacy web client keydown handler.
 * Keep in sync with `addons/web/static/src/main.js` (document.addEventListener("keydown", …), Alt branch).
 * Tests: `addons/web/static/tests/test_webclient_shortcut_contract.js`.
 */
(function () {
  var ALT = [
    { key: "n", when: "list route (DATA_ROUTES_SLUGS)", action: "Navigate to #<route>/new" },
    { key: "s", when: "form route (edit|new)", action: "Click #btn-save when enabled" },
    { key: "e", when: "edit control present", action: "Click .btn-edit or #btn-edit" },
    { key: "l", when: "form route", action: "Return to list hash for route" },
    { key: "k", when: "list route", action: "dispatchActWindowForListRoute + switch to kanban + reload records" },
    { key: "p", when: "print/preview control", action: "Click #btn-preview-pdf or #btn-print-form" },
  ];
  window.__ERP_WEBCLIENT_SHORTCUT_CONTRACT = Object.freeze({
    alt: Object.freeze(ALT.map(Object.freeze)),
    escape: Object.freeze({
      when: "modal / preview open",
      action: "Click .o-report-preview-close or .o-attachment-close",
    }),
    modK: Object.freeze({
      note: "Command palette via services/hotkey.js (not Alt)",
    }),
    /** Post-1.250 / 1.250.1: modular boot (`app/main.js`) — see `docs/odoo19-webclient-gap-table.md` hotkeys row. */
    modular: Object.freeze([
      Object.freeze({
        key: "alt+h",
        when: "outside inputs",
        action: "Navigate to #home",
        source: "Services.hotkey.register from bootModernWebClient",
      }),
      Object.freeze({
        key: "mod+k",
        when: "global",
        action: "Open command palette",
        source: "commandPalette.initHotkey after startServices",
      }),
      Object.freeze({
        key: "alt+k",
        when: "list route (DATA_ROUTES_SLUGS)",
        action: "dispatchActWindowForListRoute + switch to kanban (shortcutAltK)",
        source: "main.js keydown Alt branch",
      }),
    ]),
  });
})();
