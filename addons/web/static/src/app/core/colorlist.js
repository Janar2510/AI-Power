/**
 * ColorList OWL component (Track I3).
 * Odoo 19 boundary parity: color picker for kanban records, tags.
 * Exposes AppCore.ColorList.
 */

const owl = window.owl;
const { Component, useState, xml } = owl;
import { useExternalListener } from "./hooks.js";

// 12-color palette matching Odoo 19 CE
const COLORS = [
  { idx: 0, name: "No color", css: "transparent" },
  { idx: 1, name: "Red", css: "#e06c75" },
  { idx: 2, name: "Orange", css: "#e5a44a" },
  { idx: 3, name: "Yellow", css: "#e5d04a" },
  { idx: 4, name: "Lime", css: "#98c379" },
  { idx: 5, name: "Green", css: "#2e7d32" },
  { idx: 6, name: "Teal", css: "#21867a" },
  { idx: 7, name: "Cyan", css: "#56b6c2" },
  { idx: 8, name: "Blue", css: "#61afef" },
  { idx: 9, name: "Indigo", css: "#5e81f4" },
  { idx: 10, name: "Purple", css: "#c678dd" },
  { idx: 11, name: "Pink", css: "#d44e8e" },
];

export class ColorList extends Component {
  static template = xml`
    <div class="o-colorlist">
      <button type="button"
              class="o-colorlist-toggle"
              t-att-style="'background:' + currentColor.css"
              t-att-aria-label="'Color: ' + currentColor.name"
              t-on-click="toggleExpanded">
        <t t-if="!state.expanded">&#9660;</t>
        <t t-else="">&#9650;</t>
      </button>
      <t t-if="state.expanded">
        <div class="o-colorlist-swatches" role="listbox" aria-label="Color picker">
          <t t-foreach="colors" t-as="color" t-key="color.idx">
            <button type="button"
                    class="o-colorlist-swatch"
                    t-att-class="{ 'o-colorlist-swatch--selected': props.value === color.idx }"
                    role="option"
                    t-att-aria-selected="props.value === color.idx ? 'true' : 'false'"
                    t-att-aria-label="color.name"
                    t-att-style="'background:' + color.css"
                    t-on-click="() => selectColor(color.idx)"/>
          </t>
        </div>
      </t>
    </div>`;

  static props = {
    value: { type: Number, optional: true },
    onColorSelect: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  static colors = COLORS;

  setup() {
    this.state = useState({ expanded: false });
    this.colors = COLORS;
    useExternalListener(window, "click", this.onWindowClick.bind(this));
  }

  get currentColor() {
    return COLORS.find((c) => c.idx === (this.props.value ?? 0)) || COLORS[0];
  }

  toggleExpanded() {
    this.state.expanded = !this.state.expanded;
  }

  selectColor(idx) {
    this.state.expanded = false;
    if (typeof this.props.onColorSelect === "function") {
      this.props.onColorSelect(idx);
    }
  }

  onWindowClick(ev) {
    if (!this.state.expanded) return;
    const root = ev.target.closest(".o-colorlist");
    if (!root) this.state.expanded = false;
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.ColorList = ColorList;
window.AppCore.COLOR_PALETTE = COLORS;
