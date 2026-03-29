/**
 * AutoComplete OWL component (Track I3).
 * Odoo 19 boundary parity: source function/array, keyboard nav, debounce, selection.
 * Used as the base for many2one fields. Exposes AppCore.AutoComplete.
 */

const owl = window.owl;
const { Component, useState, xml, useRef, onWillUnmount } = owl;
import { useExternalListener, useDebounce } from "./hooks.js";

export class AutoComplete extends Component {
  static template = xml`
    <div class="o-autocomplete" t-att-class="{ 'o-autocomplete--open': state.open }">
      <input
        t-ref="input"
        type="text"
        class="o-autocomplete-input o-field-input"
        t-att-placeholder="props.placeholder || ''"
        t-att-value="state.inputValue"
        t-att-disabled="props.disabled ? '' : null"
        autocomplete="off"
        t-on-input="onInput"
        t-on-keydown="onKeyDown"
        t-on-focus="onFocus"
        t-on-blur="onBlur"
        t-att-aria-expanded="state.open ? 'true' : 'false'"
        aria-autocomplete="list"
        t-att-aria-activedescendant="state.activeIdx >= 0 ? 'o-ac-option-' + state.activeIdx : ''"
      />
      <t t-if="state.open and state.options.length">
        <ul class="o-autocomplete-list" role="listbox">
          <t t-foreach="state.options" t-as="option" t-key="option_index">
            <li
              t-att-id="'o-ac-option-' + option_index"
              class="o-autocomplete-option"
              t-att-class="{ 'o-autocomplete-option--active': state.activeIdx === option_index }"
              role="option"
              t-att-aria-selected="state.activeIdx === option_index ? 'true' : 'false'"
              t-on-mousedown.prevent="() => selectOption(option)">
              <t t-esc="option.label"/>
            </li>
          </t>
        </ul>
      </t>
      <t t-if="state.open and !state.options.length and !state.loading">
        <div class="o-autocomplete-empty">No results</div>
      </t>
    </div>`;

  static props = {
    /** source(term) → Promise<{value, label}[]> or [{value,label}] */
    source: Function,
    value: { optional: true },
    onSelect: { type: Function, optional: true },
    onChange: { type: Function, optional: true },
    placeholder: { type: String, optional: true },
    disabled: { type: Boolean, optional: true },
    debounce: { type: Number, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.state = useState({
      inputValue: this._labelFor(this.props.value) || "",
      open: false,
      options: [],
      loading: false,
      activeIdx: -1,
    });
    this.inputRef = useRef("input");
    this._search = useDebounce(this._doSearch.bind(this), this.props.debounce ?? 250);
    useExternalListener(document, "click", this.onDocumentClick.bind(this));
  }

  _labelFor(value) {
    if (!value) return "";
    if (typeof value === "object") return value.label || value.name || String(value.id || "");
    return String(value);
  }

  onInput(ev) {
    const term = ev.target.value;
    this.state.inputValue = term;
    if (typeof this.props.onChange === "function") this.props.onChange(term);
    this._search(term);
  }

  onFocus() {
    if (!this.state.open) {
      this._doSearch(this.state.inputValue);
    }
  }

  onBlur() {
    // Blur handled by document click; don't close here immediately to allow mousedown
  }

  async _doSearch(term) {
    this.state.loading = true;
    this.state.open = true;
    try {
      const result = await Promise.resolve(this.props.source(term));
      const options = Array.isArray(result) ? result : [];
      this.state.options = options;
      this.state.activeIdx = options.length > 0 ? 0 : -1;
    } catch (_e) {
      this.state.options = [];
    } finally {
      this.state.loading = false;
    }
  }

  onKeyDown(ev) {
    const { open, options, activeIdx } = this.state;
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      if (!open) { this._doSearch(this.state.inputValue); return; }
      this.state.activeIdx = Math.min(activeIdx + 1, options.length - 1);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      this.state.activeIdx = Math.max(activeIdx - 1, 0);
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (open && options[activeIdx]) {
        this.selectOption(options[activeIdx]);
      }
    } else if (ev.key === "Escape") {
      this.closeList();
    } else if (ev.key === "Tab") {
      if (open && options[activeIdx]) {
        this.selectOption(options[activeIdx]);
      } else {
        this.closeList();
      }
    }
  }

  selectOption(option) {
    this.state.inputValue = option.label || "";
    this.closeList();
    if (typeof this.props.onSelect === "function") {
      this.props.onSelect(option);
    }
  }

  closeList() {
    this.state.open = false;
    this.state.options = [];
    this.state.activeIdx = -1;
  }

  onDocumentClick(ev) {
    if (!this.state.open) return;
    const input = this.inputRef.el;
    const root = input && input.closest(".o-autocomplete");
    if (root && !root.contains(ev.target)) {
      this.closeList();
    }
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.AutoComplete = AutoComplete;
