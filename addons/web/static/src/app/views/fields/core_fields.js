/**
 * Core field OWL components — 10 types (Track M2).
 * Odoo 19 boundary parity: char, integer, float, boolean, date, datetime, text, selection, monetary, html.
 * Each registered with fieldRegistry.add(type, { component }).
 */

const owl = window.owl;
const { Component, xml } = owl;
import { fieldRegistry } from "./field.js";

// ─── Shared field props contract ───────────────────────────────────────────────
const BASE_FIELD_PROPS = {
  name: String,
  value: { optional: true },
  record: Object,
  fieldInfo: { type: Object, optional: true },
  editMode: { type: Boolean, optional: true },
  onChange: { type: Function, optional: true },
  slots: { type: Object, optional: true },
};

function emitChange(component, value) {
  if (typeof component.props.onChange === "function") {
    component.props.onChange(component.props.name, value);
  }
}

// ─── CharField ────────────────────────────────────────────────────────────────
export class CharField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value"><t t-esc="props.value || ''"/></span>
    </t>
    <t t-else="">
      <input type="text" class="o-field-input"
             t-att-value="props.value || ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  onChange(v) { emitChange(this, v); }
}

// ─── IntegerField ─────────────────────────────────────────────────────────────
export class IntegerField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-numeric"><t t-esc="props.value ?? ''"/></span>
    </t>
    <t t-else="">
      <input type="number" step="1" class="o-field-input o-field-numeric"
             t-att-value="props.value ?? ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(parseInt(ev.target.value, 10))"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  onChange(v) { emitChange(this, isNaN(v) ? 0 : v); }
}

// ─── FloatField ───────────────────────────────────────────────────────────────
export class FloatField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-numeric">
        <t t-esc="props.value != null ? Number(props.value).toFixed(props.fieldInfo and props.fieldInfo.digits or 2) : ''"/>
      </span>
    </t>
    <t t-else="">
      <input type="number" step="any" class="o-field-input o-field-numeric"
             t-att-value="props.value ?? ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(parseFloat(ev.target.value))"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  onChange(v) { emitChange(this, isNaN(v) ? 0.0 : v); }
}

// ─── BooleanField ─────────────────────────────────────────────────────────────
export class BooleanField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-boolean"
            t-att-class="{ 'o-field-boolean--true': props.value, 'o-field-boolean--false': !props.value }">
        <t t-if="props.value">&#10003;</t>
        <t t-else="">&#8211;</t>
      </span>
    </t>
    <t t-else="">
      <input type="checkbox" class="o-field-checkbox"
             t-att-checked="props.value ? '' : null"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.checked)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  onChange(v) { emitChange(this, !!v); }
}

// ─── DateField ────────────────────────────────────────────────────────────────
export class DateField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-date"><t t-esc="formatDate(props.value)"/></span>
    </t>
    <t t-else="">
      <input type="date" class="o-field-input o-field-date"
             t-att-value="isoDate(props.value)"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  formatDate(v) {
    if (!v) return "";
    try { return new Date(v).toLocaleDateString(); } catch (_e) { return String(v); }
  }
  isoDate(v) {
    if (!v) return "";
    try { return v.slice ? v.slice(0, 10) : ""; } catch (_e) { return ""; }
  }
  onChange(v) { emitChange(this, v); }
}

// ─── DatetimeField ────────────────────────────────────────────────────────────
export class DatetimeField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-datetime"><t t-esc="formatDatetime(props.value)"/></span>
    </t>
    <t t-else="">
      <input type="datetime-local" class="o-field-input o-field-datetime"
             t-att-value="isoDatetime(props.value)"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  formatDatetime(v) {
    if (!v) return "";
    try { return new Date(v).toLocaleString(); } catch (_e) { return String(v); }
  }
  isoDatetime(v) {
    if (!v) return "";
    try { return v.replace ? v.replace(" ", "T").slice(0, 16) : ""; } catch (_e) { return ""; }
  }
  onChange(v) { emitChange(this, v ? v.replace("T", " ") : v); }
}

// ─── TextField ────────────────────────────────────────────────────────────────
export class TextField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-text"><t t-esc="props.value || ''"/></span>
    </t>
    <t t-else="">
      <textarea class="o-field-input o-field-textarea"
                t-att-name="props.name"
                t-on-change="(ev) => onChange(ev.target.value)">
        <t t-esc="props.value || ''"/>
      </textarea>
    </t>`;
  static props = BASE_FIELD_PROPS;
  onChange(v) { emitChange(this, v); }
}

// ─── SelectionField ───────────────────────────────────────────────────────────
export class SelectionField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-selection"><t t-esc="selectedLabel"/></span>
    </t>
    <t t-else="">
      <select class="o-field-input o-field-select"
              t-att-name="props.name"
              t-on-change="(ev) => onChange(ev.target.value)">
        <option value="">-</option>
        <t t-foreach="selection" t-as="opt" t-key="opt[0]">
          <option t-att-value="opt[0]" t-att-selected="props.value === opt[0] ? '' : null">
            <t t-esc="opt[1]"/>
          </option>
        </t>
      </select>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get selection() {
    return (this.props.fieldInfo && this.props.fieldInfo.selection) || [];
  }
  get selectedLabel() {
    const opt = this.selection.find((o) => o[0] === this.props.value);
    return opt ? opt[1] : (this.props.value || "-");
  }
  onChange(v) { emitChange(this, v === "" ? false : v); }
}

// ─── MonetaryField ────────────────────────────────────────────────────────────
export class MonetaryField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-value o-field-monetary">
        <t t-if="currencySymbol"><t t-esc="currencySymbol"/>&nbsp;</t>
        <t t-esc="formattedValue"/>
      </span>
    </t>
    <t t-else="">
      <div class="o-field-monetary-input">
        <t t-if="currencySymbol">
          <span class="o-field-monetary-symbol"><t t-esc="currencySymbol"/></span>
        </t>
        <input type="number" step="0.01" class="o-field-input o-field-numeric"
               t-att-value="props.value ?? ''"
               t-att-name="props.name"
               t-on-change="(ev) => onChange(parseFloat(ev.target.value))"/>
      </div>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get currencySymbol() {
    // Try to get from record currency_id or fieldInfo
    const currencyId = this.props.record.currency_id;
    if (Array.isArray(currencyId) && currencyId[1]) {
      // Try symbol lookup (USD → $, EUR → €, etc.)
      const symbols = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
      return symbols[String(currencyId[1]).toUpperCase()] || String(currencyId[1]);
    }
    return "";
  }
  get formattedValue() {
    const v = this.props.value;
    if (v == null) return "";
    return Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  onChange(v) { emitChange(this, isNaN(v) ? 0 : v); }
}

// ─── BadgeField (widget: badge) ───────────────────────────────────────────────
export class BadgeField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-badge"><t t-esc="displayText"/></span>
    </t>
    <t t-else="">
      <input type="text" class="o-field-input"
             t-att-value="props.value || ''"
             t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get displayText() {
    const v = this.props.value;
    if (v == null || v === "") return "—";
    return String(v);
  }
  onChange(v) { emitChange(this, v); }
}

// ─── StatusbarField (widget: statusbar) ──────────────────────────────────────
export class StatusbarField extends Component {
  static template = xml`
    <div class="o-field-statusbar" role="list">
      <t t-foreach="steps" t-as="step" t-key="step[0]">
        <span class="o-field-statusbar-step"
              t-att-class="{ 'o-field-statusbar-step--active': step[0] === props.value }">
          <t t-esc="step[1]"/>
        </span>
      </t>
    </div>`;
  static props = BASE_FIELD_PROPS;
  get steps() {
    const fi = this.props.fieldInfo || {};
    return fi.selection || [];
  }
}

// ─── PriorityField (widget: priority) ────────────────────────────────────────
export class PriorityField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-priority" t-att-aria-label="'Priority ' + level">
        <t t-foreach="starIndices" t-as="n" t-key="n">
          <span t-att-class="{ 'o-field-priority-star--on': n &lt;= level }" class="o-field-priority-star">&#9733;</span>
        </t>
      </span>
    </t>
    <t t-else="">
      <select class="o-field-input o-field-select" t-att-name="props.name"
              t-on-change="(ev) => onChange(parseInt(ev.target.value, 10))">
        <t t-foreach="starIndices" t-as="n" t-key="n">
          <option t-att-value="n" t-att-selected="n === level ? '' : null"><t t-esc="n"/></option>
        </t>
      </select>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get starIndices() {
    return [1, 2, 3, 4, 5];
  }
  get level() {
    const v = parseInt(this.props.value, 10);
    if (isNaN(v) || v < 0) return 0;
    return Math.min(5, v);
  }
  onChange(v) { emitChange(this, v); }
}

// ─── UrlField ─────────────────────────────────────────────────────────────────
export class UrlField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <a t-if="href" class="o-field-link o-field-url" t-att-href="href" rel="noopener noreferrer" target="_blank">
        <t t-esc="href"/>
      </a>
      <span t-else="" class="o-field-value">—</span>
    </t>
    <t t-else="">
      <input type="url" class="o-field-input" t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get href() {
    const v = this.props.value;
    if (!v) return "";
    const s = String(v);
    if (/^https?:\/\//i.test(s)) return s;
    return "https://" + s;
  }
  onChange(v) { emitChange(this, v); }
}

// ─── EmailField ───────────────────────────────────────────────────────────────
export class EmailField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <a t-if="props.value" class="o-field-link o-field-email" t-att-href="'mailto:' + props.value">
        <t t-esc="props.value"/>
      </a>
      <span t-else="" class="o-field-value">—</span>
    </t>
    <t t-else="">
      <input type="email" class="o-field-input" t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  onChange(v) { emitChange(this, v); }
}

// ─── PhoneField ─────────────────────────────────────────────────────────────────
export class PhoneField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <a t-if="props.value" class="o-field-link o-field-phone" t-att-href="'tel:' + telHref">
        <t t-esc="props.value"/>
      </a>
      <span t-else="" class="o-field-value">—</span>
    </t>
    <t t-else="">
      <input type="tel" class="o-field-input" t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get telHref() {
    return String(this.props.value || "").replace(/\s+/g, "");
  }
  onChange(v) { emitChange(this, v); }
}

// ─── ImageField (URL or /web/image path) ──────────────────────────────────────
export class ImageField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-image-wrap">
        <img t-if="imgSrc" class="o-field-image-thumb" t-att-src="imgSrc" alt=""/>
        <span t-else="" class="o-field-image-placeholder">—</span>
      </span>
    </t>
    <t t-else="">
      <input type="text" class="o-field-input" placeholder="Image URL"
             t-att-value="props.value || ''" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get imgSrc() {
    const v = this.props.value;
    if (!v) return "";
    if (typeof v === "string") return v;
    return "";
  }
  onChange(v) { emitChange(this, v); }
}

// ─── ColorPickerField ─────────────────────────────────────────────────────────
export class ColorPickerField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <span class="o-field-color-swatch" t-att-style="swatchStyle" role="img" t-att-aria-label="colorLabel"/>
    </t>
    <t t-else="">
      <input type="color" class="o-field-color-input" t-att-value="hexValue" t-att-name="props.name"
             t-on-change="(ev) => onChange(ev.target.value)"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  get hexValue() {
    const v = this.props.value;
    if (!v) return getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim() || "#000000";
    const s = String(v);
    return s.startsWith("#") ? s : "#" + s;
  }
  get swatchStyle() {
    return "background-color:" + this.hexValue + ";box-shadow:inset 0 0 0 1px var(--color-border);";
  }
  get colorLabel() {
    return "Color " + (this.props.value || this.hexValue);
  }
  onChange(v) { emitChange(this, v); }
}

// ─── HtmlField ────────────────────────────────────────────────────────────────
export class HtmlField extends Component {
  static template = xml`
    <t t-if="!props.editMode">
      <div class="o-field-value o-field-html" t-out="props.value || ''"/>
    </t>
    <t t-else="">
      <div class="o-field-html-editor"
           contenteditable="true"
           t-out="props.value || ''"
           t-on-blur="onBlur"
           t-att-data-field="props.name"/>
    </t>`;
  static props = BASE_FIELD_PROPS;
  onBlur(ev) {
    emitChange(this, ev.target.innerHTML);
  }
}

// ─── RadioField (widget: radio — selection with radio buttons) ────────────────
export class RadioField extends Component {
  static template = xml`
    <div class="o-field-radio" t-att-class="{ 'o-field-radio--inline': props.fieldInfo and props.fieldInfo.horizontal }">
      <t t-if="!props.editMode">
        <span class="o-field-value o-field-selection"><t t-esc="selectedLabel"/></span>
      </t>
      <t t-else="">
        <t t-foreach="selection" t-as="opt" t-key="opt[0]">
          <label class="o-field-radio-option">
            <input type="radio"
                   t-att-name="props.name"
                   t-att-value="opt[0]"
                   t-att-checked="props.value === opt[0] ? '' : null"
                   t-on-change="() => onChange(opt[0])"/>
            <span class="o-field-radio-label"><t t-esc="opt[1]"/></span>
          </label>
        </t>
      </t>
    </div>`;
  static props = BASE_FIELD_PROPS;
  get selection() {
    return (this.props.fieldInfo && this.props.fieldInfo.selection) || [];
  }
  get selectedLabel() {
    const opt = this.selection.find((o) => o[0] === this.props.value);
    return opt ? opt[1] : (this.props.value || "—");
  }
  onChange(v) { emitChange(this, v); }
}

// ─── BinaryField (widget: binary — download / file upload) ───────────────────
export class BinaryField extends Component {
  static template = xml`
    <div class="o-field-binary">
      <t t-if="!props.editMode">
        <a t-if="downloadHref"
           class="o-field-link o-field-binary-link"
           t-att-href="downloadHref"
           rel="noopener noreferrer"
           download="">
          <span class="o-field-binary-icon">&#128196;</span>
          <t t-esc="filename"/>
        </a>
        <span t-else="" class="o-field-value">—</span>
      </t>
      <t t-else="">
        <input type="file" class="o-field-file-input"
               t-att-name="props.name"
               t-on-change="onFileChange"/>
        <t t-if="filename">
          <span class="o-field-binary-current"><t t-esc="filename"/></span>
        </t>
      </t>
    </div>`;
  static props = BASE_FIELD_PROPS;
  get filename() {
    const fi = this.props.fieldInfo || {};
    return fi.filename || (this.props.value ? "file" : "");
  }
  get downloadHref() {
    const v = this.props.value;
    if (!v) return "";
    const record = this.props.record || {};
    if (record.id && this.props.name) {
      const model = (this.props.fieldInfo && this.props.fieldInfo.model) || "";
      if (model) {
        return `/web/content?model=${model}&id=${record.id}&field=${this.props.name}&download=true`;
      }
    }
    // Fallback: try to render base64 data URI
    return v.startsWith("data:") ? v : "data:application/octet-stream;base64," + v;
  }
  onFileChange(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const result = re.target.result;
      // Strip data URI prefix to get raw base64
      const b64 = result.indexOf(",") >= 0 ? result.split(",")[1] : result;
      emitChange(this, b64);
    };
    reader.readAsDataURL(file);
  }
}

// ─── ProgressBarField (widget: progressbar) ──────────────────────────────────
export class ProgressBarField extends Component {
  static template = xml`
    <div class="o-field-progressbar">
      <div class="o-field-progressbar-track" role="progressbar"
           t-att-aria-valuenow="pct"
           aria-valuemin="0" aria-valuemax="100">
        <div class="o-field-progressbar-fill"
             t-att-style="'width:' + pct + '%;background:var(--color-primary)'"/>
      </div>
      <span class="o-field-progressbar-label"><t t-esc="pct"/>%</span>
    </div>`;
  static props = BASE_FIELD_PROPS;
  get pct() {
    const v = parseFloat(this.props.value);
    if (isNaN(v)) return 0;
    const max = (this.props.fieldInfo && this.props.fieldInfo.max_value) || 100;
    return Math.min(100, Math.max(0, Math.round((v / max) * 100)));
  }
}

// ─── HandleField (widget: handle — sequence drag grip) ────────────────────────
export class HandleField extends Component {
  static template = xml`
    <span class="o-field-handle" aria-hidden="true" title="Drag to reorder">&#9723;</span>`;
  static props = BASE_FIELD_PROPS;
}

// ─── Register all core fields ─────────────────────────────────────────────────
function reg(type, component, format) {
  const desc = { type, component };
  if (typeof format === "function") desc.format = format;
  fieldRegistry.add(type, desc);
}

const CORE_FIELD_COMPONENTS = [
  ["char",      CharField],
  ["integer",   IntegerField],
  ["float",     FloatField],
  ["boolean",   BooleanField],
  ["date",      DateField],
  ["datetime",  DatetimeField],
  ["text",      TextField],
  ["selection", SelectionField],
  ["monetary",  MonetaryField],
  ["html",      HtmlField],
];

CORE_FIELD_COMPONENTS.forEach(([type, component]) => {
  reg(type, component);
});

// Post-1.248 P3: Odoo-style widget aliases + list formatters
reg("badge", BadgeField, (v) => (v == null || v === "" ? "" : String(v)));
reg("statusbar", StatusbarField, (v, _r, col) => {
  const sel = (col && col.selection) || [];
  const opt = sel.find((o) => o[0] === v);
  return opt ? opt[1] : (v != null ? String(v) : "");
});
reg("priority", PriorityField, (v) => (v == null ? "" : String(v)));
reg("url", UrlField, (v) => (v == null ? "" : String(v)));
reg("email", EmailField, (v) => (v == null ? "" : String(v)));
reg("phone", PhoneField, (v) => (v == null ? "" : String(v)));
reg("image", ImageField, (v) => (v ? "[image]" : ""));
reg("color_picker", ColorPickerField, (v) => (v == null ? "" : String(v)));
// 1.250.14: extended widget matrix
reg("radio", RadioField, (v, _r, col) => {
  const sel = (col && col.selection) || [];
  const opt = sel.find((o) => o[0] === v);
  return opt ? opt[1] : (v != null ? String(v) : "");
});
reg("binary", BinaryField, (v) => (v ? "[file]" : ""));
reg("progressbar", ProgressBarField, (v) => (v != null ? String(v) + "%" : ""));
reg("handle", HandleField, () => "");

window.AppCore = window.AppCore || {};
window.AppCore.CoreFields = Object.fromEntries(
  CORE_FIELD_COMPONENTS.map(([t, c]) => [t, c])
);
// 1.250.14 additions
Object.assign(window.AppCore.CoreFields, {
  radio: RadioField,
  binary: BinaryField,
  progressbar: ProgressBarField,
  handle: HandleField,
});

// Named exports already declared via `export class` above.
