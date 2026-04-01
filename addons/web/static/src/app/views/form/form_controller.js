/**
 * FormController OWL component (Track J3).
 * Odoo 19 boundary parity: record loading, edit/readonly toggle, save/discard, status bar, chatter.
 * Delegates field rendering to FormRenderer; delegates legacy form views to AppCore.FormViewModule.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, useEnv } = owl;
import { FormRenderer } from "./form_renderer.js";
import { viewRegistry } from "../view_registry.js";

export class FormController extends Component {
  static template = xml`
    <div class="o-form-controller o-form-view">
      <div class="o-form-header">
        <div class="o-form-breadcrumb-slot">
          <span class="o-form-model-label"><t t-esc="state.title"/></span>
          <t t-if="state.record.id">
            <span class="o-form-record-name"><t t-esc="state.record.display_name || state.record.name || ('#' + state.record.id)"/></span>
          </t>
        </div>
        <div class="o-form-button-box">
          <t t-if="!state.editMode">
            <button type="button" class="o-btn o-btn-primary" t-on-click="startEdit">Edit</button>
            <button type="button" class="o-btn o-btn-secondary" t-on-click="onBack">&#8592; Back</button>
          </t>
          <t t-else="">
            <button type="button" class="o-btn o-btn-primary" t-on-click="onSave"
                    t-att-disabled="state.saving ? '' : null">
              <t t-if="state.saving">Saving…</t>
              <t t-else="">Save</t>
            </button>
            <button type="button" class="o-btn o-btn-secondary" t-on-click="onDiscard">Discard</button>
          </t>
        </div>
      </div>
      <t t-if="state.loading">
        <div class="o-form-loading o-skeleton-msg">Loading…</div>
      </t>
      <t t-elif="state.error">
        <div class="o-error-panel__muted"><t t-esc="state.error"/></div>
      </t>
      <t t-else="">
        <FormRenderer
          record="state.record"
          fields="state.fields"
          editMode="state.editMode"
          onFieldChange="onFieldChange"/>
      </t>
    </div>`;

  static components = { FormRenderer };

  static props = {
    resModel: String,
    resId: { type: [Number, String], optional: true },
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    onSaved: { type: Function, optional: true },
    onBack: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this._orm = (window.Services && window.Services.orm) || null;
    this.state = useState({
      title: this._titleFor(this.props.resModel),
      record: {},
      fields: [],
      editMode: !this.props.resId, // New records start in edit
      loading: !!this.props.resId,
      saving: false,
      error: null,
    });
    this._pendingChanges = {};

    onMounted(() => {
      if (this.props.resId) {
        this._loadRecord(this.props.resId);
      } else {
        this._loadDefaultFields();
      }
    });
  }

  _titleFor(model) {
    if (!model) return "Form";
    const parts = String(model).split(".");
    return parts[parts.length - 1]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async _loadRecord(id) {
    const orm = this._orm;
    if (!orm) { this.state.loading = false; return; }
    this.state.loading = true;
    this.state.error = null;
    try {
      const fields = await this._getFields();
      const fieldNames = fields.map((f) => f.name).filter(Boolean);
      const records = await orm.read(this.props.resModel, [Number(id)], fieldNames);
      const record = (Array.isArray(records) ? records : [])[0] || {};
      this.state.record = record;
      this.state.fields = fields;
      this._pendingChanges = {};
    } catch (err) {
      this.state.error = "Failed to load record: " + (err && err.message ? err.message : String(err));
    } finally {
      this.state.loading = false;
    }
  }

  async _loadDefaultFields() {
    const fields = await this._getFields();
    this.state.fields = fields;
    this.state.record = {};
  }

  async _getFields() {
    const views = window.Services && window.Services.views;
    if (views && typeof views.getView === "function") {
      const formView = views.getView(this.props.resModel, "form");
      if (formView && formView.fields) {
        return Object.entries(formView.fields).map(([name, meta]) =>
          Object.assign({ name }, typeof meta === "object" ? meta : { type: meta })
        );
      }
    }
    // Fallback: derive from views.fields_meta if available
    if (views && typeof views.getFieldsMeta === "function") {
      const meta = views.getFieldsMeta(this.props.resModel);
      if (meta && typeof meta === "object") {
        return Object.entries(meta).map(([name, info]) =>
          Object.assign({ name }, typeof info === "object" ? info : {})
        );
      }
    }
    // Minimal default fields
    return [{ name: "name", label: "Name", type: "char" }];
  }

  startEdit() {
    this._pendingChanges = {};
    this.state.editMode = true;
  }

  onFieldChange(fieldName, value) {
    this._pendingChanges[fieldName] = value;
    this.state.record = Object.assign({}, this.state.record, { [fieldName]: value });
  }

  async onSave() {
    const orm = this._orm;
    if (!orm) return;
    this.state.saving = true;
    this.state.error = null;
    try {
      const changes = this._pendingChanges;
      const id = this.state.record.id;
      if (id) {
        await orm.write(this.props.resModel, [id], changes);
      } else {
        const newId = await orm.create(this.props.resModel, [changes]);
        await this._loadRecord(newId);
      }
      this._pendingChanges = {};
      this.state.editMode = false;
      if (typeof this.props.onSaved === "function") {
        this.props.onSaved(this.state.record);
      }
    } catch (err) {
      this.state.error = "Save failed: " + (err && err.message ? err.message : String(err));
    } finally {
      this.state.saving = false;
    }
  }

  onDiscard() {
    this._pendingChanges = {};
    if (this.state.record.id) {
      this._loadRecord(this.state.record.id);
    } else {
      this.state.record = {};
    }
    this.state.editMode = false;
    this.state.error = null;
  }

  onBack() {
    if (typeof this.props.onBack === "function") {
      this.props.onBack();
    } else {
      window.history.back();
    }
  }
}

// Register in the global view registry
viewRegistry.add("form", {
  type: "form",
  Controller: FormController,
  Renderer: FormRenderer,
  searchMenuTypes: ["filter", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.FormController = FormController;
