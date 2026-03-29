/**
 * KanbanController OWL component (Track J4).
 * Odoo 19 boundary parity: column-based display, quick create, drag feedback.
 * Delegates heavy rendering to AppCore.KanbanViewModule until full OWL migration.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, useRef, useEnv } = owl;
import { viewRegistry } from "../view_registry.js";

export class KanbanController extends Component {
  static template = xml`
    <div class="o-kanban-controller o-kanban-view" t-ref="root">
      <div class="o-kanban-header">
        <h2 class="o-kanban-title"><t t-esc="title"/></h2>
        <button type="button" class="o-btn o-btn-primary" t-on-click="onNew">New</button>
      </div>
      <div class="o-kanban-content" t-ref="kanbanContent"/>
    </div>`;

  static props = {
    resModel: String,
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    groupBy: { type: String, optional: true },
    onOpenRecord: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this.rootRef = useRef("root");
    this.contentRef = useRef("kanbanContent");
    this.state = useState({ loading: false });

    onMounted(() => {
      this._renderLegacy();
    });
  }

  get title() {
    const parts = String(this.props.resModel || "").split(".");
    return parts[parts.length - 1].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _renderLegacy() {
    const KVM = window.AppCore && window.AppCore.KanbanViewModule;
    const el = this.contentRef.el;
    if (!el) return;
    if (KVM && typeof KVM.render === "function") {
      KVM.render(el, {
        model: this.props.resModel,
        domain: this.props.domain || [],
        context: this.props.context || {},
        groupBy: this.props.groupBy || null,
        rpc: window.Services && window.Services.rpc,
        viewsSvc: window.Services && window.Services.views,
      });
    } else {
      el.innerHTML = '<p class="o-skeleton-msg">Kanban view loading…</p>';
    }
  }

  onNew() {
    const model = this.props.resModel;
    if (model) {
      window.location.hash = "#" + model.replace(/\./g, "_") + "/new";
    }
  }
}

// Register
viewRegistry.add("kanban", {
  type: "kanban",
  Controller: KanbanController,
  searchMenuTypes: ["filter", "groupBy", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.KanbanController = KanbanController;
