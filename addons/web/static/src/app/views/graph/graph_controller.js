/**
 * GraphController OWL component (Track J4).
 * Delegates rendering to AppCore.GraphViewModule (legacy chrome + chart libs).
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, useRef, useEnv } = owl;
import { viewRegistry } from "../view_registry.js";

export class GraphController extends Component {
  static template = xml`
    <div class="o-graph-controller o-graph-view">
      <div class="o-graph-toolbar" t-ref="toolbar"/>
      <div class="o-graph-content" t-ref="content"/>
    </div>`;

  static props = {
    resModel: String,
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    measure: { type: String, optional: true },
    groupBy: { type: Array, optional: true },
    mode: { type: String, optional: true }, // bar | line | pie
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this.toolbarRef = useRef("toolbar");
    this.contentRef = useRef("content");
    onMounted(() => this._renderLegacy());
  }

  _renderLegacy() {
    const GVM = window.AppCore && window.AppCore.GraphViewModule;
    const el = this.contentRef.el;
    if (!el) return;
    if (GVM && typeof GVM.render === "function") {
      GVM.render(el, {
        model: this.props.resModel,
        domain: this.props.domain || [],
        mode: this.props.mode || "bar",
        groupBy: this.props.groupBy || [],
        rpc: window.Services && window.Services.rpc,
      });
    } else {
      el.innerHTML = '<p class="o-skeleton-msg">Graph view loading…</p>';
    }
  }
}

viewRegistry.add("graph", {
  type: "graph",
  Controller: GraphController,
  searchMenuTypes: ["filter", "groupBy", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.GraphController = GraphController;
