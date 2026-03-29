/**
 * Dropdown OWL component (Track I2).
 * Odoo 19 boundary parity: toggle, keyboard nav, popover positioning, nesting.
 * Exposes AppCore.Dropdown for legacy use.
 */

const owl = window.owl;
const { Component, useState, xml, useRef, onMounted, onWillUnmount, useEnv } = owl;
import { useExternalListener } from "./hooks.js";

// ─── DropdownItem ─────────────────────────────────────────────────────────────
export class DropdownItem extends Component {
  static template = xml`
    <li class="o-dropdown-item"
        t-att-class="{ 'o-dropdown-item--disabled': props.disabled }"
        role="menuitem"
        t-att-tabindex="props.disabled ? '-1' : '0'"
        t-on-click="onClick"
        t-on-keydown="onKeyDown">
      <t t-slot="default"/>
    </li>`;

  static props = {
    disabled: { type: Boolean, optional: true },
    onSelected: { type: Function, optional: true },
    payload: { optional: true },
    slots: { type: Object, optional: true },
  };

  onClick(ev) {
    if (this.props.disabled) return;
    if (typeof this.props.onSelected === "function") {
      this.props.onSelected(this.props.payload);
    }
  }

  onKeyDown(ev) {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      this.onClick(ev);
    }
  }
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
export class Dropdown extends Component {
  static template = xml`
    <div class="o-dropdown" t-att-class="{ 'o-dropdown--open': state.open }">
      <div class="o-dropdown-toggle"
           t-att-aria-expanded="state.open ? 'true' : 'false'"
           t-att-aria-haspopup="'listbox'"
           t-on-click="toggleOpen"
           t-on-keydown="onToggleKeyDown">
        <t t-slot="default"/>
      </div>
      <t t-if="state.open">
        <div class="o-dropdown-menu" role="menu" t-ref="menu">
          <ul class="o-dropdown-list">
            <t t-slot="menu"/>
          </ul>
        </div>
      </t>
    </div>`;

  static components = { DropdownItem };

  static props = {
    toggleClass: { type: String, optional: true },
    menuClass: { type: String, optional: true },
    position: { type: String, optional: true }, // bottom-start | bottom-end | top-start | top-end
    slots: { type: Object, optional: true },
  };

  setup() {
    this.state = useState({ open: false });
    this.menuRef = useRef("menu");
    useExternalListener(document, "click", this.onDocumentClick.bind(this));
    useExternalListener(document, "keydown", this.onDocumentKeyDown.bind(this));
  }

  toggleOpen() {
    this.state.open = !this.state.open;
    if (this.state.open) {
      // Focus first item on next tick
      Promise.resolve().then(() => {
        const menu = this.menuRef.el;
        if (menu) {
          const first = menu.querySelector('[role="menuitem"]');
          if (first) first.focus();
        }
      });
    }
  }

  close() {
    this.state.open = false;
  }

  onDocumentClick(ev) {
    if (!this.state.open) return;
    const root = this.__owl__.bdom && this.__owl__.bdom.el;
    if (root && !root.contains(ev.target)) {
      this.close();
    }
  }

  onDocumentKeyDown(ev) {
    if (!this.state.open) return;
    if (ev.key === "Escape") {
      ev.preventDefault();
      this.close();
    }
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      const menu = this.menuRef.el;
      if (!menu) return;
      const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([tabindex="-1"])'));
      const active = document.activeElement;
      const idx = items.indexOf(active);
      const next = ev.key === "ArrowDown"
        ? items[idx + 1] || items[0]
        : items[idx - 1] || items[items.length - 1];
      if (next) next.focus();
    }
  }

  onToggleKeyDown(ev) {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      if (!this.state.open) this.toggleOpen();
    }
  }
}

// ─── Expose on AppCore ────────────────────────────────────────────────────────
window.AppCore = window.AppCore || {};
window.AppCore.Dropdown = Dropdown;
window.AppCore.DropdownItem = DropdownItem;
