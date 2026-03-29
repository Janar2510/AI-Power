/**
 * ListRenderer OWL component (Track J2).
 * Odoo 19 boundary parity: table rows, field cells via field registry, sorting, selection, aggregates.
 * Delegates to legacy AppCore.ListViewModule.render() when full modular build is absent.
 */

const owl = window.owl;
const { Component, useState, xml, useRef } = owl;

function escHtml(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatCell(record, col, fieldRegistry) {
  const field = col.name || col;
  const value = record[field];
  if (fieldRegistry && typeof fieldRegistry.format === "function") {
    try { return fieldRegistry.format(field, value, record, col); } catch (_e) { /* noop */ }
  }
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((v) => (Array.isArray(v) ? v[1] || v[0] : String(v))).join(", ");
  return String(value);
}

export class ListRenderer extends Component {
  static template = xml`
    <div class="o-list-renderer">
      <table class="o-list-table" role="grid">
        <thead>
          <tr>
            <th t-if="props.selectable" class="o-list-th-checkbox">
              <input type="checkbox"
                     t-att-checked="allSelected ? '' : null"
                     t-att-indeterminate="someSelected and !allSelected ? '' : null"
                     aria-label="Select all"
                     t-on-change="onToggleAll"/>
            </th>
            <t t-foreach="columns" t-as="col" t-key="col.name || col_index">
              <th class="o-list-th"
                  t-att-class="{ 'o-list-th--sortable': col.sortable !== false, 'o-list-th--sorted': isSorted(col) }"
                  t-att-aria-sort="getSortDir(col)"
                  t-on-click="() => onSort(col)">
                <span class="o-list-th-label"><t t-esc="col.label || col.name || col"/></span>
                <t t-if="isSorted(col)">
                  <span class="o-list-sort-icon" aria-hidden="true">
                    <t t-if="props.order and props.order.startsWith(col.name) and props.order.endsWith('desc')">&#9660;</t>
                    <t t-else="">&#9650;</t>
                  </span>
                </t>
              </th>
            </t>
            <th class="o-list-th-actions"/>
          </tr>
        </thead>
        <tbody>
          <t t-foreach="props.records" t-as="record" t-key="record.id || record_index">
            <tr class="o-list-row"
                t-att-class="{ 'o-list-row--selected': isSelected(record), 'o-list-row--new': record._isNew }"
                t-att-data-id="record.id"
                t-on-click="(ev) => onRowClick(ev, record)">
              <td t-if="props.selectable" class="o-list-td-checkbox" t-on-click.stop="">
                <input type="checkbox"
                       t-att-checked="isSelected(record) ? '' : null"
                       t-att-aria-label="'Select record ' + record.id"
                       t-on-change="(ev) => onToggleRecord(ev, record)"/>
              </td>
              <t t-foreach="columns" t-as="col" t-key="col.name || col_index">
                <td class="o-list-td"
                    t-att-class="'o-list-td--' + (col.type || 'char')"
                    t-att-data-field="col.name || col">
                  <span class="o-list-cell-value"><t t-esc="renderCell(record, col)"/></span>
                </td>
              </t>
              <td class="o-list-td-actions">
                <button type="button" class="o-list-row-action o-btn-icon"
                        aria-label="Delete row"
                        t-on-click.stop="() => onDeleteRow(record)">&#x2715;</button>
              </td>
            </tr>
          </t>
          <t t-if="!props.records.length">
            <tr class="o-list-row-empty">
              <td t-att-colspan="colSpan" class="o-list-empty-cell">
                <t t-esc="props.emptyMessage || 'No records found'"/>
              </td>
            </tr>
          </t>
        </tbody>
        <t t-if="hasAggregates">
          <tfoot class="o-list-aggregates">
            <tr>
              <td t-if="props.selectable"/>
              <t t-foreach="columns" t-as="col" t-key="col.name || col_index">
                <td class="o-list-td-aggregate">
                  <t t-esc="getAggregate(col)"/>
                </td>
              </t>
              <td/>
            </tr>
          </tfoot>
        </t>
      </table>
    </div>`;

  static props = {
    records: Array,
    columns: Array,
    selectable: { type: Boolean, optional: true },
    selectedIds: { type: Array, optional: true },
    order: { type: String, optional: true },
    aggregates: { type: Object, optional: true },
    emptyMessage: { type: String, optional: true },
    onSort: { type: Function, optional: true },
    onRowClick: { type: Function, optional: true },
    onToggleRecord: { type: Function, optional: true },
    onToggleAll: { type: Function, optional: true },
    onDeleteRow: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  get columns() {
    return (this.props.columns || []).map((c) =>
      typeof c === "string" ? { name: c, label: c } : c
    );
  }

  get colSpan() {
    return this.columns.length + (this.props.selectable ? 2 : 1);
  }

  get allSelected() {
    const ids = this.props.selectedIds || [];
    return ids.length > 0 && ids.length >= (this.props.records || []).length;
  }

  get someSelected() {
    return (this.props.selectedIds || []).length > 0;
  }

  get hasAggregates() {
    const agg = this.props.aggregates;
    return agg && Object.keys(agg).length > 0;
  }

  isSelected(record) {
    const ids = this.props.selectedIds || [];
    return ids.includes(record.id);
  }

  isSorted(col) {
    const order = this.props.order || "";
    return order.startsWith(col.name || "");
  }

  getSortDir(col) {
    if (!this.isSorted(col)) return "none";
    const order = this.props.order || "";
    return order.endsWith("desc") ? "descending" : "ascending";
  }

  renderCell(record, col) {
    const fieldReg = window.Services && window.Services.fieldRegistry;
    return formatCell(record, col, fieldReg);
  }

  getAggregate(col) {
    const agg = this.props.aggregates;
    if (!agg) return "";
    const name = col.name || col;
    return agg[name] != null ? String(agg[name]) : "";
  }

  onSort(col) {
    if (col.sortable === false) return;
    if (typeof this.props.onSort === "function") {
      this.props.onSort(col);
    }
  }

  onRowClick(ev, record) {
    if (typeof this.props.onRowClick === "function") {
      this.props.onRowClick(record, ev);
    }
  }

  onToggleRecord(ev, record) {
    if (typeof this.props.onToggleRecord === "function") {
      this.props.onToggleRecord(record, ev.target.checked);
    }
  }

  onToggleAll(ev) {
    if (typeof this.props.onToggleAll === "function") {
      this.props.onToggleAll(ev.target.checked);
    }
  }

  onDeleteRow(record) {
    if (typeof this.props.onDeleteRow === "function") {
      this.props.onDeleteRow(record);
    }
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.ListRenderer = ListRenderer;
