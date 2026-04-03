/**
 * GanttController OWL component (Phase 1.250.13).
 * Wraps the legacy AppCore.GanttViewModule timeline renderer inside an OWL
 * component and registers the "gantt" view type in viewRegistry.
 *
 * Delegates all data loading and DOM rendering to GanttViewModule.render()
 * so the two runtimes stay in sync.
 */

const owl = window.owl;
const { Component, xml, onMounted, onPatched, useRef, useEnv } = owl;
import { viewRegistry } from "../view_registry.js";

export class GanttController extends Component {
  static template = xml`
    <div class="o-gantt-controller o-gantt-view">
      <div class="o-gantt-content" t-ref="content"/>
    </div>`;

  static props = {
    resModel: String,
    route: { type: String, optional: true },
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    dateStart: { type: String, optional: true },
    dateStop: { type: String, optional: true },
    searchTerm: { type: String, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this.contentRef = useRef("content");
    onMounted(() => this._renderLegacy());
    onPatched(() => this._renderLegacy());
  }

  _renderLegacy() {
    const GVM = window.AppCore && window.AppCore.GanttViewModule;
    const el = this.contentRef.el;
    if (!el) return;
    if (!GVM || typeof GVM.render !== "function") {
      el.innerHTML = '<p class="o-skeleton-msg">Gantt view loading…</p>';
      return;
    }

    const rpc = window.Services && window.Services.rpc;
    const route = this.props.route || this.props.resModel.split(".").pop();

    GVM.render(el, {
      model: this.props.resModel,
      route: route,
      records: [],
      searchTerm: this.props.searchTerm || "",
      dateStart: this.props.dateStart || "date_start",
      dateStop: this.props.dateStop || "date_deadline",
      domain: this.props.domain || [],
      rpc,
      getTitle: (r) => {
        const t = window.__ERP_SHELL_ROUTES && window.__ERP_SHELL_ROUTES.getTitle;
        return typeof t === "function" ? t(r) : r;
      },
      renderViewSwitcher: (r, v) => {
        const lv = window.__ERP_LIST_VIEWS;
        return lv && typeof lv.renderViewSwitcher === "function"
          ? lv.renderViewSwitcher(r, v)
          : "";
      },
      loadRecords: (model, r, s, sf, vt, sid, oo, ord, dom) => {
        const lv = window.__ERP_LIST_VIEWS;
        if (lv && typeof lv.loadRecords === "function") {
          lv.loadRecords(model, r, s, sf, vt, sid, oo, ord, dom);
        }
      },
      dispatchListActWindowThenFormHash: (r, suffix, src) => {
        const lr = window.ErpLegacyRouter;
        if (lr && typeof lr.dispatchListActWindowThenFormHash === "function") {
          lr.dispatchListActWindowThenFormHash(r, suffix, src);
        } else {
          window.location.hash = r + "/" + suffix;
        }
      },
      setViewAndReload: (r, v) => {
        const lv = window.__ERP_LIST_VIEWS;
        if (lv && typeof lv.setViewAndReload === "function") lv.setViewAndReload(r, v);
      },
      setListState: (s) => {
        const lv = window.__ERP_LIST_VIEWS;
        if (lv && typeof lv.setCurrentListState === "function") lv.setCurrentListState(s);
      },
      setActionStack: (s) => {
        const rt = window.__erpLegacyRuntime;
        if (rt && typeof rt.setActionStack === "function") rt.setActionStack(s);
      },
      attachActWindowFormLinkDelegation: (sel, r, src) => {
        const lv = window.__ERP_LIST_VIEWS;
        if (lv && typeof lv.attachActWindowFormLinkDelegation === "function") {
          lv.attachActWindowFormLinkDelegation(sel, r, src);
        }
      },
    });
  }
}

viewRegistry.add("gantt", {
  type: "gantt",
  Controller: GanttController,
  searchMenuTypes: ["filter", "groupBy", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.GanttController = GanttController;
