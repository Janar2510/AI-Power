/**
 * ActivityController OWL component (Phase 1.250.13).
 * Wraps the legacy AppCore.ActivityViewModule matrix renderer inside an OWL
 * component and registers the "activity" view type in viewRegistry.
 *
 * Delegates all data loading and DOM rendering to ActivityViewModule.render().
 */

const owl = window.owl;
const { Component, xml, onMounted, onPatched, useRef, useEnv } = owl;
import { viewRegistry } from "../view_registry.js";

export class ActivityController extends Component {
  static template = xml`
    <div class="o-activity-controller o-activity-view">
      <div class="o-activity-content" t-ref="content"/>
    </div>`;

  static props = {
    resModel: String,
    route: { type: String, optional: true },
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    searchTerm: { type: String, optional: true },
    userId: { type: Number, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this.contentRef = useRef("content");
    onMounted(() => this._renderLegacy());
    onPatched(() => this._renderLegacy());
  }

  _renderLegacy() {
    const AVM = window.AppCore && window.AppCore.ActivityViewModule;
    const el = this.contentRef.el;
    if (!el) return;
    if (!AVM || typeof AVM.render !== "function") {
      el.innerHTML = '<p class="o-skeleton-msg">Activity view loading…</p>';
      return;
    }

    const rpc = window.Services && window.Services.rpc;
    const route = this.props.route || this.props.resModel.split(".").pop();
    const userId = this.props.userId != null
      ? this.props.userId
      : (window.__ERP_SESSION && window.__ERP_SESSION.uid) || 1;

    AVM.render(el, {
      model: this.props.resModel,
      route: route,
      records: [],
      activityTypes: [],
      activities: [],
      searchTerm: this.props.searchTerm || "",
      domain: this.props.domain || [],
      userId,
      rpc,
      showToast: (msg, type) => {
        const ui = window.UIComponents && window.UIComponents.Toast;
        if (typeof ui === "function") ui({ message: msg, type: type || "info" });
      },
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
      getListState: () => {
        const lv = window.__ERP_LIST_VIEWS;
        return lv && typeof lv.getCurrentListState === "function"
          ? lv.getCurrentListState()
          : {};
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

viewRegistry.add("activity", {
  type: "activity",
  Controller: ActivityController,
  searchMenuTypes: ["filter", "groupBy", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.ActivityController = ActivityController;
