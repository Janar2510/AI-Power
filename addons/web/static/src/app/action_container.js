/**
 * ActionContainer OWL component (Track K2).
 * Odoo 19 boundary parity: listens to action state changes and mounts the current Controller.
 * Replaces direct #action-manager DOM manipulation from legacy main.js.
 *
 * The container subscribes to the erp:action-update CustomEvent bus and
 * AppCore.ActionBus.on("ACTION_MANAGER:UPDATE") to receive view change signals.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, onWillUnmount, useRef } = owl;
import { resolveViewDescriptor } from "./views/view_registry.js";
import { ListController } from "./views/list/list_controller.js";
import { FormController } from "./views/form/form_controller.js";
import { KanbanController } from "./views/kanban/kanban_controller.js";
import { WithSearch } from "./search/with_search.js";

/** Post-1.248 P3: live list controllers use ControlPanel + SearchModel domain. */
const ListWithSearch = WithSearch(ListController, { searchMenuTypes: ["filter", "groupBy", "favorite"] });
/** Post-1.249 Phase C: kanban uses same search chrome + merged domain for legacy KVM. */
const KanbanWithSearch = WithSearch(KanbanController, { searchMenuTypes: ["filter", "groupBy", "favorite"] });
/** Post-1.250 Phase P2: OWL form path gets ControlPanel + SearchModel (filter/favorite) when CSP allows OWL. */
const FormWithSearch = WithSearch(FormController, {
  formMode: true,
  searchMenuTypes: ["filter", "favorite"],
});

// ─── ActionBus ────────────────────────────────────────────────────────────────
// Simple publish-subscribe bus for ACTION_MANAGER:UPDATE events.
// Legacy concat-bundle code triggers updates via window.AppCore.ActionBus.trigger().
const _listeners = new Map();

export const ActionBus = {
  on(event, handler) {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event).add(handler);
    return () => _listeners.get(event).delete(handler);
  },
  trigger(event, detail) {
    const bucket = _listeners.get(event);
    if (bucket) bucket.forEach((fn) => { try { fn(detail); } catch (_e) {} });
    // Also dispatch DOM event for legacy listeners
    window.dispatchEvent(new CustomEvent("erp:action-update", { detail }));
  },
};

window.AppCore = window.AppCore || {};
window.AppCore.ActionBus = ActionBus;

// ─── ActionContainer ──────────────────────────────────────────────────────────
const CONTROLLER_MAP = {
  list: ListWithSearch,
  form: FormWithSearch,
  kanban: KanbanWithSearch,
};

export class ActionContainer extends Component {
  static template = xml`
    <div class="o-action-container" t-ref="root">
      <t t-if="state.componentInfo">
        <t t-component="state.componentInfo.Controller"
           t-props="state.componentInfo.props"
           t-key="state.componentInfo.key"/>
      </t>
      <t t-elif="state.loading">
        <div class="o-action-loading o-skeleton-msg">Loading…</div>
      </t>
      <t t-else="">
        <div class="o-action-placeholder"/>
      </t>
    </div>`;

  setup() {
    this.state = useState({
      componentInfo: null,
      loading: false,
    });

    this._unsubscribeBus = ActionBus.on("ACTION_MANAGER:UPDATE", this._onUpdate.bind(this));

    const onDomUpdate = (ev) => this._onUpdate(ev.detail);
    onMounted(() => {
      // Post-1.248 Phase 0: legacy main.js _tryOwlRoute only takes OWL path when this is true
      window.__ERP_OWL_ACTION_CONTAINER_MOUNTED = true;
      window.addEventListener("erp:action-update", onDomUpdate);
    });
    onWillUnmount(() => {
      window.__ERP_OWL_ACTION_CONTAINER_MOUNTED = false;
      this._unsubscribeBus();
      window.removeEventListener("erp:action-update", onDomUpdate);
    });
  }

  _onUpdate(detail) {
    if (!detail) return;
    const { type, viewType, resModel, resId, props } = detail;

    if (type === "clear") {
      this.state.componentInfo = null;
      return;
    }

    if (type === "loading") {
      this.state.loading = true;
      return;
    }

    this.state.loading = false;

    // Resolve controller from view registry or built-in map
    const vt = viewType || "list";
    let Controller = null;
    const descriptor = resolveViewDescriptor(vt, this.env);
    if (descriptor && descriptor.Controller) {
      Controller = descriptor.Controller;
      if (vt === "list" && Controller === ListController) {
        Controller = ListWithSearch;
      }
      if (vt === "kanban" && Controller === KanbanController) {
        Controller = KanbanWithSearch;
      }
      if (vt === "form" && Controller === FormController) {
        Controller = FormWithSearch;
      }
    } else {
      Controller = CONTROLLER_MAP[vt] || ListController;
    }

    const controllerProps = Object.assign(
      { resModel: resModel || "res.partner", viewType: vt },
      resId ? { resId } : {},
      props || {}
    );

    this.state.componentInfo = {
      Controller,
      props: controllerProps,
      key: viewType + "-" + resModel + "-" + (resId || "list") + "-" + Date.now(),
    };
  }
}

/**
 * CSP / Trusted Types: no unsafe-eval for OWL template compilation.
 * owl_bridge.js uses this when cspScriptEvalBlocked() or when owl.mount fails.
 * Does not set __ERP_OWL_ACTION_CONTAINER_MOUNTED — legacy main.js keeps routing.
 *
 * Do not replace #action-manager innerHTML: an empty placeholder leaves the main area blank if
 * legacy route() is slow or errors; keep server "Loading…" until loadRecords/renderForm runs.
 */
ActionContainer.fallbackMount = function actionContainerFallbackMount(env, target) {
  window.__ERP_OWL_ACTION_CONTAINER_MOUNTED = false;
  if (target) {
    target.setAttribute("data-erp-owl-fallback", "1");
    target.classList.add("o-action-container--csp-fallback");
  }
  return {
    destroy() {
      if (target) {
        target.removeAttribute("data-erp-owl-fallback");
        target.classList.remove("o-action-container--csp-fallback");
      }
    },
    mode: "fallback",
  };
};

window.AppCore.ActionContainer = ActionContainer;
