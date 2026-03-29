/**
 * Dialog + ConfirmationDialog OWL components (Track I2).
 * Odoo 19 boundary parity: modal stacking, Escape key, overlay service pattern.
 * Exposes AppCore.DialogService for legacy concat-bundle callers.
 */

const owl = window.owl;
const { Component, useState, xml, useRef, onMounted, onWillUnmount, useEnv } = owl;
import { useExternalListener } from "./hooks.js";

// ─── Overlay stack ────────────────────────────────────────────────────────────
const _overlayStack = [];

function pushOverlay(entry) {
  _overlayStack.push(entry);
  document.body.classList.add("o-modal-open");
}

function removeOverlay(id) {
  const idx = _overlayStack.findIndex((e) => e.id === id);
  if (idx >= 0) _overlayStack.splice(idx, 1);
  if (_overlayStack.length === 0) {
    document.body.classList.remove("o-modal-open");
  }
}

let _nextId = 1;
function nextOverlayId() {
  return "dialog-" + (_nextId++);
}

// ─── Dialog component ─────────────────────────────────────────────────────────
export class Dialog extends Component {
  static template = xml`
    <div class="o-dialog-overlay"
         role="dialog"
         aria-modal="true"
         t-att-aria-labelledby="props.titleId || 'o-dialog-title'"
         t-on-click.self="onOverlayClick">
      <div class="o-dialog-panel" t-att-style="props.size ? ('max-width:' + sizeMap[props.size]) : ''">
        <div class="o-dialog-header">
          <h3 t-att-id="props.titleId || 'o-dialog-title'" class="o-dialog-title">
            <t t-esc="props.title || 'Dialog'"/>
          </h3>
          <button t-if="props.closeable !== false"
                  type="button"
                  class="o-dialog-close-btn"
                  aria-label="Close"
                  t-on-click="onClose">&#x2715;</button>
        </div>
        <div class="o-dialog-body">
          <t t-slot="default"/>
        </div>
        <div t-if="__slots__.footer" class="o-dialog-footer">
          <t t-slot="footer"/>
        </div>
      </div>
    </div>`;

  static props = {
    title: { type: String, optional: true },
    titleId: { type: String, optional: true },
    size: { type: String, optional: true }, // sm | md | lg | xl | full
    closeable: { type: Boolean, optional: true },
    onClose: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.sizeMap = {
      sm: "480px",
      md: "640px",
      lg: "800px",
      xl: "960px",
      full: "100vw",
    };
    this._overlayId = nextOverlayId();
    pushOverlay({ id: this._overlayId, component: this });
    useExternalListener(document, "keydown", this.onKeyDown.bind(this));
    onWillUnmount(() => {
      removeOverlay(this._overlayId);
    });
    const focusRef = useRef("firstFocus");
    onMounted(() => {
      const panel = document.querySelector('.o-dialog-overlay[role="dialog"]');
      if (panel) {
        const focusable = panel.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) focusable.focus();
      }
    });
  }

  onKeyDown(ev) {
    if (ev.key === "Escape") {
      // Only close topmost dialog
      const top = _overlayStack[_overlayStack.length - 1];
      if (top && top.id === this._overlayId) {
        ev.preventDefault();
        this.onClose();
      }
    }
  }

  onOverlayClick() {
    if (this.props.closeable !== false) this.onClose();
  }

  onClose() {
    if (typeof this.props.onClose === "function") {
      this.props.onClose();
    }
  }
}

// ─── ConfirmationDialog component ─────────────────────────────────────────────
export class ConfirmationDialog extends Component {
  static template = xml`
    <Dialog title="props.title" t-on-dialog-close="onCancel">
      <p class="o-dialog-body-text"><t t-esc="props.body || props.message"/></p>
      <t t-set-slot="footer">
        <div class="o-dialog-actions">
          <button type="button" class="o-btn o-btn-secondary" t-on-click="onCancel">
            <t t-esc="props.cancelLabel || 'Cancel'"/>
          </button>
          <button type="button" class="o-btn o-btn-primary" t-on-click="onConfirm">
            <t t-esc="props.confirmLabel || 'OK'"/>
          </button>
        </div>
      </t>
    </Dialog>`;

  static components = { Dialog };

  static props = {
    title: { type: String, optional: true },
    body: { type: String, optional: true },
    message: { type: String, optional: true },
    confirmLabel: { type: String, optional: true },
    cancelLabel: { type: String, optional: true },
    onConfirm: Function,
    onCancel: Function,
  };

  onConfirm() {
    this.props.onConfirm();
  }
  onCancel() {
    this.props.onCancel();
  }
}

// ─── DialogService (callable from legacy concat bundle) ────────────────────────
function mountTransientDialog(ComponentClass, props) {
  const container = document.createElement("div");
  container.className = "o-dialog-mount-point";
  document.body.appendChild(container);
  let app = null;
  function cleanup() {
    if (app) {
      try { app.destroy(); } catch (_e) { /* noop */ }
      app = null;
    }
    if (container.parentNode) container.parentNode.removeChild(container);
  }
  const fullProps = Object.assign({}, props, {
    onClose: function () {
      if (typeof props.onClose === "function") props.onClose();
      cleanup();
    },
    onCancel: function (result) {
      if (typeof props.onCancel === "function") props.onCancel(result);
      cleanup();
    },
    onConfirm: function (result) {
      if (typeof props.onConfirm === "function") props.onConfirm(result);
      cleanup();
    },
  });
  try {
    const owlLib = window.owl;
    if (owlLib && owlLib.mount) {
      app = owlLib.mount(ComponentClass, container, { props: fullProps });
    }
  } catch (_e) {
    // Fallback: no OWL, DOM already handled by legacy confirm_dialog.js
    cleanup();
  }
  return { close: cleanup };
}

const DialogService = {
  /**
   * Open a confirmation dialog.
   * @returns {Promise<boolean>}
   */
  confirm(opts) {
    return new Promise((resolve) => {
      mountTransientDialog(ConfirmationDialog, {
        title: opts.title,
        body: opts.body || opts.message,
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        onClose: () => resolve(false),
      });
    });
  },

  /**
   * Open any Dialog with arbitrary content.
   * @param {typeof Component} ComponentClass — the component to render inside a Dialog wrapper
   * @param {object} props
   * @returns {{ close: Function }}
   */
  open(ComponentClass, props) {
    return mountTransientDialog(ComponentClass, props || {});
  },
};

window.AppCore = window.AppCore || {};
window.AppCore.DialogService = DialogService;
window.AppCore.Dialog = Dialog;
window.AppCore.ConfirmationDialog = ConfirmationDialog;

export { DialogService };
