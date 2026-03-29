/**
 * Field OWL component wrapper (Track M1).
 * Odoo 19 boundary parity: resolves widget from fields registry, visual feedback,
 * readonly/edit mode switching, required/invalid states.
 *
 * Usage:
 *   <Field name="partner_id" record="state.record" fieldInfo="fieldsInfo.partner_id" editMode="true"/>
 */

const owl = window.owl;
const { Component, useState, xml, useEnv } = owl;

// ─── Field Registry ───────────────────────────────────────────────────────────
// Mirrors registry.category("fields") from Odoo 19.
const _fieldDescriptors = new Map();

export const fieldRegistry = {
  add(type, descriptor) {
    const entry = Object.assign({ type }, descriptor);
    _fieldDescriptors.set(type, entry);
    return entry;
  },
  get(type) {
    return _fieldDescriptors.get(String(type || "char"));
  },
  getAll() {
    return Array.from(_fieldDescriptors.values());
  },
  has(type) {
    return _fieldDescriptors.has(String(type || ""));
  },
  /**
   * List/form readonly cell formatting (Post-1.248 P3).
   * Uses descriptor.format(value, record, col) when present; else char fallback.
   */
  format(fieldName, value, record, col) {
    const widget = (col && col.widget) || (col && col.type) || "char";
    const desc = _fieldDescriptors.get(String(widget || "char"));
    if (desc && typeof desc.format === "function") {
      try {
        const out = desc.format(value, record, col);
        if (out != null) return String(out);
      } catch (_e) { /* noop */ }
    }
    if (value == null) return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      return value.map((v) => (Array.isArray(v) ? v[1] || v[0] : String(v))).join(", ");
    }
    return String(value);
  },
};

window.AppCore = window.AppCore || {};
window.AppCore.fieldRegistry = fieldRegistry;
window.Services = window.Services || {};
window.Services.fieldRegistry = fieldRegistry;

// ─── Visual feedback helpers ───────────────────────────────────────────────────
export function getFieldVisualFeedback(fieldInfo, value, editMode) {
  const info = fieldInfo || {};
  const required = !!info.required;
  const readonly = !editMode || !!info.readonly;
  const invalid = required && editMode && (value === null || value === undefined || value === "");
  return { required, readonly, invalid };
}

// ─── Field component ───────────────────────────────────────────────────────────
export class Field extends Component {
  static template = xml`
    <div class="o-field"
         t-att-class="{
           'o-field--readonly': feedback.readonly,
           'o-field--required': feedback.required,
           'o-field--invalid': feedback.invalid,
           'o-field--loading': state.loading,
         }"
         t-att-data-field-name="props.name"
         t-att-data-field-type="fieldType">
      <t t-if="FieldComponent">
        <t t-component="FieldComponent" t-props="fieldProps"/>
      </t>
      <t t-else="">
        <t t-if="feedback.readonly">
          <span class="o-field-value"><t t-esc="displayValue"/></span>
        </t>
        <t t-else="">
          <input type="text"
                 class="o-field-input"
                 t-att-value="displayValue"
                 t-att-name="props.name"
                 t-att-required="feedback.required ? '' : null"
                 t-att-readonly="feedback.readonly ? '' : null"
                 t-on-change="onInputChange"/>
        </t>
      </t>
      <t t-if="feedback.invalid">
        <div class="o-field-invalid-msg">This field is required</div>
      </t>
    </div>`;

  static props = {
    name: String,
    record: Object,
    fieldInfo: { type: Object, optional: true },
    editMode: { type: Boolean, optional: true },
    onChange: { type: Function, optional: true },
    widget: { type: String, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.state = useState({ loading: false });
  }

  get fieldInfo() {
    return this.props.fieldInfo || {};
  }

  get fieldType() {
    return this.props.widget || this.fieldInfo.type || "char";
  }

  get feedback() {
    return getFieldVisualFeedback(
      this.fieldInfo,
      this.props.record[this.props.name],
      this.props.editMode !== false
    );
  }

  get value() {
    return this.props.record[this.props.name];
  }

  get displayValue() {
    const v = this.value;
    if (v == null) return "";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (Array.isArray(v)) {
      // Many2one/x2many: [id, name]
      if (Array.isArray(v[0])) return v.map((pair) => (Array.isArray(pair) ? pair[1] || pair[0] : String(pair))).join(", ");
      return Array.isArray(v) ? v.map((i) => (Array.isArray(i) ? i[1] || i[0] : String(i))).join(", ") : String(v);
    }
    return String(v);
  }

  get FieldComponent() {
    const descriptor = fieldRegistry.get(this.fieldType);
    return descriptor ? descriptor.component : null;
  }

  get fieldProps() {
    return {
      name: this.props.name,
      value: this.value,
      record: this.props.record,
      fieldInfo: this.fieldInfo,
      editMode: this.props.editMode !== false && !this.feedback.readonly,
      onChange: this.props.onChange,
    };
  }

  onInputChange(ev) {
    if (typeof this.props.onChange === "function") {
      this.props.onChange(this.props.name, ev.target.value);
    }
  }
}

window.AppCore.Field = Field;
