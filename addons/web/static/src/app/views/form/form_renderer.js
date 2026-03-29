/**
 * FormRenderer OWL component (Track J3).
 * Odoo 19 boundary parity: renders arch groups/fields, dispatches to field registry for values.
 * No arch compiler yet — renders fields from fieldsMeta as a flat fieldset.
 */

const owl = window.owl;
const { Component, xml } = owl;

function formatValue(field, value, record) {
  const fieldReg = window.Services && window.Services.fieldRegistry;
  if (fieldReg && typeof fieldReg.format === "function") {
    try { return fieldReg.format(field.name || field, value, record, field); } catch (_e) { /* noop */ }
  }
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.map((v) => (Array.isArray(v) ? v[1] || v[0] : String(v))).join(", ");
  }
  return String(value);
}

function isTextField(type) {
  return ["text", "html"].includes(type);
}

function isDateField(type) {
  return ["date", "datetime"].includes(type);
}

function isNumericField(type) {
  return ["integer", "float", "monetary"].includes(type);
}

export class FormRenderer extends Component {
  static template = xml`
    <div class="o-form-renderer o-form-sheet">
      <t t-foreach="fieldGroups" t-as="group" t-key="group_index">
        <div class="o-form-group">
          <t t-foreach="group" t-as="field" t-key="field.name">
            <div class="o-form-row"
                 t-att-class="{ 'o-form-row--readonly': !props.editMode }">
              <label class="o-form-label"
                     t-att-for="'field-' + field.name">
                <t t-esc="field.label || field.name"/>
                <t t-if="field.required and props.editMode">
                  <span class="o-field-required" aria-hidden="true"> *</span>
                </t>
              </label>
              <div class="o-form-field"
                   t-att-class="'o-form-field--' + (field.type || 'char')">
                <t t-if="!props.editMode">
                  <span class="o-field-value"
                        t-att-class="{ 'o-field-empty': !getDisplayValue(field) }">
                    <t t-esc="getDisplayValue(field) || '-'"/>
                  </span>
                </t>
                <t t-elif="field.type === 'boolean'">
                  <input type="checkbox"
                         t-att-id="'field-' + field.name"
                         t-att-checked="props.record[field.name] ? '' : null"
                         t-on-change="(ev) => onFieldChange(field, ev.target.checked)"/>
                </t>
                <t t-elif="isTextField(field.type)">
                  <textarea class="o-field-textarea o-field-input"
                            t-att-id="'field-' + field.name"
                            t-att-name="field.name"
                            t-on-change="(ev) => onFieldChange(field, ev.target.value)">
                    <t t-esc="props.record[field.name] || ''"/>
                  </textarea>
                </t>
                <t t-elif="isNumericField(field.type)">
                  <input type="number"
                         class="o-field-input o-field-numeric"
                         t-att-id="'field-' + field.name"
                         t-att-name="field.name"
                         t-att-value="props.record[field.name] ?? ''"
                         t-on-change="(ev) => onFieldChange(field, ev.target.valueAsNumber)"/>
                </t>
                <t t-elif="field.type === 'selection' and field.selection">
                  <select class="o-field-input o-field-select"
                          t-att-id="'field-' + field.name"
                          t-att-name="field.name"
                          t-on-change="(ev) => onFieldChange(field, ev.target.value)">
                    <option value="">-</option>
                    <t t-foreach="field.selection" t-as="opt" t-key="opt[0]">
                      <option t-att-value="opt[0]"
                              t-att-selected="props.record[field.name] === opt[0] ? '' : null">
                        <t t-esc="opt[1]"/>
                      </option>
                    </t>
                  </select>
                </t>
                <t t-else="">
                  <input type="text"
                         class="o-field-input"
                         t-att-id="'field-' + field.name"
                         t-att-name="field.name"
                         t-att-value="props.record[field.name] ?? ''"
                         t-att-type="isDateField(field.type) ? (field.type === 'datetime' ? 'datetime-local' : 'date') : 'text'"
                         t-on-change="(ev) => onFieldChange(field, ev.target.value)"/>
                </t>
              </div>
            </div>
          </t>
        </div>
      </t>
    </div>`;

  static props = {
    record: Object,
    fields: Array,
    editMode: Boolean,
    onFieldChange: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  isTextField = isTextField;
  isNumericField = isNumericField;
  isDateField = isDateField;

  get fieldGroups() {
    const fields = this.props.fields || [];
    // Group into pairs of 2 for a two-column layout
    const groups = [];
    for (let i = 0; i < fields.length; i += 2) {
      groups.push(fields.slice(i, i + 2));
    }
    return groups.length ? groups : [fields];
  }

  getDisplayValue(field) {
    const value = this.props.record[field.name];
    return formatValue(field, value, this.props.record);
  }

  onFieldChange(field, value) {
    if (typeof this.props.onFieldChange === "function") {
      this.props.onFieldChange(field.name, value);
    }
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.FormRenderer = FormRenderer;
