/**
 * Relational field OWL components (Track M3).
 * Odoo 19 boundary parity: many2one, many2many_tags, one2many, x2many base.
 * Each registered with fieldRegistry.add(type, { component }).
 */

const owl = window.owl;
const { Component, useState, xml, useEnv, onMounted } = owl;
import { fieldRegistry } from "./field.js";
import { AutoComplete } from "../../core/autocomplete.js";

function emitChange(component, value) {
  if (typeof component.props.onChange === "function") {
    component.props.onChange(component.props.name, value);
  }
}

// ─── Many2oneField ────────────────────────────────────────────────────────────
export class Many2oneField extends Component {
  static template = xml`
    <div class="o-field-many2one">
      <t t-if="!props.editMode">
        <span class="o-field-value">
          <t t-if="props.value">
            <t t-esc="displayName"/>
          </t>
          <t t-else="">-</t>
        </span>
      </t>
      <t t-else="">
        <AutoComplete
          source="searchRecords"
          value="currentValue"
          onSelect="onSelect"
          placeholder="Search..."
          debounce="300"/>
      </t>
    </div>`;

  static components = { AutoComplete };

  static props = {
    name: String,
    value: { optional: true },
    record: Object,
    fieldInfo: { type: Object, optional: true },
    editMode: { type: Boolean, optional: true },
    onChange: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  get comodel() {
    return (this.props.fieldInfo && this.props.fieldInfo.comodel_name) || "";
  }

  get displayName() {
    const v = this.props.value;
    if (!v) return "";
    if (Array.isArray(v)) return v[1] || String(v[0] || "");
    if (typeof v === "object") return v.display_name || v.name || String(v.id || "");
    return String(v);
  }

  get currentValue() {
    return { label: this.displayName, value: Array.isArray(this.props.value) ? this.props.value[0] : this.props.value };
  }

  async searchRecords(term) {
    const orm = window.Services && window.Services.orm;
    const comodel = this.comodel;
    if (!orm || !comodel) return [];
    try {
      const domain = term ? [["display_name", "ilike", term]] : [];
      const results = await orm.nameSearch(comodel, term, domain, { limit: 20 });
      return (Array.isArray(results) ? results : []).map(([id, name]) => ({ value: id, label: name }));
    } catch (_e) {
      return [];
    }
  }

  onSelect(option) {
    emitChange(this, [option.value, option.label]);
  }
}

// ─── Many2manyTagsField ───────────────────────────────────────────────────────
export class Many2manyTagsField extends Component {
  static template = xml`
    <div class="o-field-many2many-tags">
      <div class="o-m2m-tags-container">
        <t t-foreach="tags" t-as="tag" t-key="tag.id">
          <span class="o-m2m-tag"
                t-att-class="'o-m2m-tag--color-' + (tag.color || 0)">
            <t t-esc="tag.name"/>
            <button t-if="props.editMode"
                    type="button"
                    class="o-m2m-tag-remove"
                    t-att-aria-label="'Remove ' + tag.name"
                    t-on-click="() => removeTag(tag.id)">&#x2715;</button>
          </span>
        </t>
        <t t-if="props.editMode">
          <AutoComplete
            source="searchTags"
            value="null"
            onSelect="addTag"
            placeholder="Add tag..."
            debounce="200"/>
        </t>
      </div>
    </div>`;

  static components = { AutoComplete };

  static props = {
    name: String,
    value: { optional: true }, // Array of [id, name] pairs or ids
    record: Object,
    fieldInfo: { type: Object, optional: true },
    editMode: { type: Boolean, optional: true },
    onChange: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  get comodel() {
    return (this.props.fieldInfo && this.props.fieldInfo.comodel_name) || "";
  }

  get tags() {
    const v = this.props.value;
    if (!Array.isArray(v)) return [];
    return v.map((item) => {
      if (Array.isArray(item)) return { id: item[0], name: item[1] || String(item[0]), color: item[2] || 0 };
      if (typeof item === "object") return item;
      return { id: item, name: String(item), color: 0 };
    });
  }

  get currentIds() {
    return this.tags.map((t) => t.id);
  }

  async searchTags(term) {
    const orm = window.Services && window.Services.orm;
    const comodel = this.comodel;
    if (!orm || !comodel) return [];
    try {
      const existing = this.currentIds;
      const domain = [
        ["id", "not in", existing],
        ...(term ? [["display_name", "ilike", term]] : []),
      ];
      const results = await orm.nameSearch(comodel, term, domain, { limit: 20 });
      return (Array.isArray(results) ? results : []).map(([id, name]) => ({ value: id, label: name }));
    } catch (_e) {
      return [];
    }
  }

  addTag(option) {
    const next = [...this.tags, { id: option.value, name: option.label, color: 0 }];
    emitChange(this, next.map((t) => [t.id, t.name]));
  }

  removeTag(id) {
    const next = this.tags.filter((t) => t.id !== id);
    emitChange(this, next.map((t) => [t.id, t.name]));
  }
}

// ─── X2ManyBase ───────────────────────────────────────────────────────────────
// Base for one2many and many2many with embedded subview (list-style).
export class X2ManyField extends Component {
  static template = xml`
    <div class="o-field-x2many">
      <div class="o-x2many-list">
        <t t-if="!rows.length">
          <span class="o-x2many-empty">No records</span>
        </t>
        <t t-foreach="rows" t-as="row" t-key="row.id || row_index">
          <div class="o-x2many-row" t-on-click="() => openRow(row)">
            <t t-esc="rowLabel(row)"/>
            <button t-if="props.editMode"
                    type="button"
                    class="o-x2many-row-remove"
                    aria-label="Remove"
                    t-on-click.stop="() => removeRow(row)">&#x2715;</button>
          </div>
        </t>
      </div>
      <button t-if="props.editMode"
              type="button"
              class="o-btn o-btn-link o-x2many-add"
              t-on-click="addRow">
        Add a line
      </button>
    </div>`;

  static props = {
    name: String,
    value: { optional: true },
    record: Object,
    fieldInfo: { type: Object, optional: true },
    editMode: { type: Boolean, optional: true },
    onChange: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  get rows() {
    const v = this.props.value;
    if (!Array.isArray(v)) return [];
    return v;
  }

  rowLabel(row) {
    if (!row) return "";
    if (Array.isArray(row)) return row[1] || String(row[0] || "");
    return row.display_name || row.name || String(row.id || "");
  }

  openRow(row) {
    const comodel = (this.props.fieldInfo && this.props.fieldInfo.comodel_name) || "";
    if (comodel && row.id) {
      window.location.hash = "#" + comodel.replace(/\./g, "_") + "/form/" + row.id;
    }
  }

  removeRow(row) {
    const next = this.rows.filter((r) => {
      const rId = Array.isArray(r) ? r[0] : (r && r.id);
      const rowId = Array.isArray(row) ? row[0] : (row && row.id);
      return rId !== rowId;
    });
    emitChange(this, next);
  }

  addRow() {
    const comodel = (this.props.fieldInfo && this.props.fieldInfo.comodel_name) || "";
    if (comodel) {
      window.location.hash = "#" + comodel.replace(/\./g, "_") + "/new";
    }
  }
}

// ─── One2manyField ────────────────────────────────────────────────────────────
export class One2manyField extends X2ManyField {
  // One2many is X2Many with write semantics (no many2many link table)
}

// ─── Register relational fields ───────────────────────────────────────────────
fieldRegistry.add("many2one", { type: "many2one", component: Many2oneField });
fieldRegistry.add("many2many", { type: "many2many", component: Many2manyTagsField });
fieldRegistry.add("many2many_tags", { type: "many2many_tags", component: Many2manyTagsField });
fieldRegistry.add("one2many", { type: "one2many", component: One2manyField });
fieldRegistry.add("x2many", { type: "x2many", component: X2ManyField });

window.AppCore = window.AppCore || {};
Object.assign(window.AppCore, {
  Many2oneField,
  Many2manyTagsField,
  One2manyField,
  X2ManyField,
});

// Named exports already declared via `export class` above.
