/**
 * PivotController OWL component (Track J4).
 * Delegates to AppCore.PivotViewModule.
 */

const owl = window.owl;
const { Component, xml, onMounted, useRef, useEnv } = owl;
import { viewRegistry } from "../view_registry.js";

export class PivotController extends Component {
  static template = xml`
    <div class="o-pivot-controller o-pivot-view">
      <div class="o-pivot-toolbar" t-ref="toolbar"/>
      <div class="o-pivot-content" t-ref="content"/>
    </div>`;

  static props = {
    resModel: String,
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    rowGroupBy: { type: Array, optional: true },
    colGroupBy: { type: Array, optional: true },
    measures: { type: Array, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this.contentRef = useRef("content");
    onMounted(() => this._renderLegacy());
  }

  _renderLegacy() {
    const PVM = window.AppCore && window.AppCore.PivotViewModule;
    const el = this.contentRef.el;
    if (!el) return;
    if (PVM && typeof PVM.render === "function") {
      PVM.render(el, {
        model: this.props.resModel,
        domain: this.props.domain || [],
        rpc: window.Services && window.Services.rpc,
      });
    } else {
      el.innerHTML = '<p class="o-skeleton-msg">Pivot view loading…</p>';
    }
  }
}

viewRegistry.add("pivot", {
  type: "pivot",
  Controller: PivotController,
  searchMenuTypes: ["filter", "groupBy", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.PivotController = PivotController;
