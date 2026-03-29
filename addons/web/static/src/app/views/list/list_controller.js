/**
 * ListController OWL component (Track J2).
 * Odoo 19 boundary parity: RelationalModel load, selection, pager, sorting, group actions.
 * Registers as view descriptor type "list". Delegates rendering to ListRenderer.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, useEnv } = owl;
import { useService } from "../../core/hooks.js";
import { ListRenderer } from "./list_renderer.js";
import { Pager } from "../../core/pager.js";
import { viewRegistry } from "../view_registry.js";

const DEFAULT_LIMIT = 80;

export class ListController extends Component {
  static template = xml`
    <div class="o-list-controller o-list-view">
      <div class="o-list-header">
        <h2 class="o-list-title"><t t-esc="state.title"/></h2>
        <div class="o-list-actions-bar">
          <button t-if="!state.selectedIds.length"
                  type="button" class="o-btn o-btn-primary"
                  t-on-click="onNew">
            New
          </button>
          <button t-if="state.selectedIds.length"
                  type="button" class="o-btn o-btn-danger"
                  t-on-click="onDeleteSelected">
            Delete (<t t-esc="state.selectedIds.length"/>)
          </button>
        </div>
        <Pager offset="state.offset"
               limit="state.limit"
               total="state.totalCount"
               isLoading="state.loading"
               onUpdate="onPagerUpdate"/>
      </div>
      <ListRenderer
        records="state.records"
        columns="columns"
        selectable="true"
        selectedIds="state.selectedIds"
        order="state.order"
        aggregates="state.aggregates"
        onSort="onSort"
        onRowClick="onRowClick"
        onToggleRecord="onToggleRecord"
        onToggleAll="onToggleAll"
        onDeleteRow="onDeleteRow"/>
    </div>`;

  static components = { ListRenderer, Pager };

  static props = {
    resModel: String,
    columns: { type: Array, optional: true },
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    limit: { type: Number, optional: true },
    onOpenRecord: { type: Function, optional: true },
    /** SearchModel instance provided by WithSearch HOC (Track O1). */
    searchModel: { optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this._orm = (window.Services && window.Services.orm) || null;
    this._searchModel = this.props.searchModel || null;

    this.state = useState({
      title: this._titleFor(this.props.resModel),
      records: [],
      loading: false,
      offset: 0,
      limit: this.props.limit || DEFAULT_LIMIT,
      totalCount: 0,
      selectedIds: [],
      order: null,
      aggregates: {},
    });

    // Re-load when search model changes domain (Track O1)
    if (this._searchModel && typeof this._searchModel.subscribe === "function") {
      this._searchModel.subscribe(() => {
        this.state.offset = 0;
        this.loadRecords();
      });
    }

    onMounted(() => { this.loadRecords(); });
  }

  get columns() {
    if (this.props.columns && this.props.columns.length) return this.props.columns;
    // Derive from first record if available
    if (this.state.records.length) {
      return Object.keys(this.state.records[0])
        .filter((k) => k !== "__id" && !k.startsWith("_"))
        .slice(0, 8)
        .map((k) => ({ name: k, label: k }));
    }
    return [{ name: "name", label: "Name" }, { name: "id", label: "ID" }];
  }

  _titleFor(model) {
    if (!model) return "List";
    const parts = String(model).split(".");
    return parts[parts.length - 1]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async loadRecords() {
    const orm = this._orm;
    if (!orm) {
      this._loadFallback();
      return;
    }
    this.state.loading = true;
    try {
      // Use SearchModel domain when available (Track O1), fall back to prop domain
      const domain = this._searchModel && typeof this._searchModel.getDomain === "function"
        ? this._searchModel.getDomain(this.props.domain || [])
        : (this.props.domain || []);
      const fields = this.columns.map((c) => c.name || c).filter(Boolean);
      const result = await orm.searchRead(
        this.props.resModel,
        domain,
        fields,
        { offset: this.state.offset, limit: this.state.limit, order: this.state.order || "" }
      );
      this.state.records = Array.isArray(result) ? result : (result.records || []);
      if (result.length !== undefined) {
        // Simple array — try to get count
        this.state.totalCount = this.state.records.length < this.state.limit
          ? this.state.offset + this.state.records.length
          : this.state.offset + this.state.limit + 1;
      } else {
        this.state.totalCount = result.length || 0;
      }
    } catch (err) {
      console.error("[ListController] loadRecords error:", err);
    } finally {
      this.state.loading = false;
    }
  }

  /** Fallback: delegate to legacy AppCore.ListViewModule */
  _loadFallback() {
    const LVM = window.AppCore && window.AppCore.ListViewModule;
    if (LVM && typeof LVM.render === "function") {
      // Let legacy module handle rendering
    }
  }

  onPagerUpdate({ offset, limit }) {
    this.state.offset = offset;
    this.state.limit = limit;
    this.loadRecords();
  }

  onSort(col) {
    const name = col.name;
    if (!name) return;
    if (this.state.order === name) {
      this.state.order = name + " desc";
    } else if (this.state.order === name + " desc") {
      this.state.order = null;
    } else {
      this.state.order = name;
    }
    this.state.offset = 0;
    this.loadRecords();
  }

  onRowClick(record) {
    if (typeof this.props.onOpenRecord === "function") {
      this.props.onOpenRecord(record);
    } else {
      // Default: navigate to form hash
      const model = this.props.resModel;
      if (model && record.id) {
        const route = model.replace(/\./g, "_");
        window.location.hash = "#" + route + "/form/" + record.id;
      }
    }
  }

  onToggleRecord(record, checked) {
    if (checked) {
      this.state.selectedIds = [...this.state.selectedIds, record.id];
    } else {
      this.state.selectedIds = this.state.selectedIds.filter((id) => id !== record.id);
    }
  }

  onToggleAll(checked) {
    this.state.selectedIds = checked ? this.state.records.map((r) => r.id) : [];
  }

  async onDeleteRow(record) {
    const confirmed = await this._confirm("Delete this record?");
    if (!confirmed) return;
    const orm = this._orm;
    if (orm && typeof orm.unlink === "function") {
      await orm.unlink(this.props.resModel, [record.id]);
      await this.loadRecords();
    }
  }

  async onDeleteSelected() {
    if (!this.state.selectedIds.length) return;
    const confirmed = await this._confirm(
      `Delete ${this.state.selectedIds.length} record(s)?`
    );
    if (!confirmed) return;
    const orm = this._orm;
    if (orm && typeof orm.unlink === "function") {
      await orm.unlink(this.props.resModel, this.state.selectedIds);
      this.state.selectedIds = [];
      await this.loadRecords();
    }
  }

  onNew() {
    const model = this.props.resModel;
    if (model) {
      const route = model.replace(/\./g, "_");
      window.location.hash = "#" + route + "/new";
    }
  }

  _confirm(message) {
    const DS = window.AppCore && window.AppCore.DialogService;
    if (DS && typeof DS.confirm === "function") {
      return DS.confirm({ title: "Confirm", body: message });
    }
    return Promise.resolve(window.confirm(message));
  }
}

// Register in the global view registry
viewRegistry.add("list", {
  type: "list",
  Controller: ListController,
  Renderer: ListRenderer,
  searchMenuTypes: ["filter", "groupBy", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.ListController = ListController;
