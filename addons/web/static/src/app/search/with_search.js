/**
 * WithSearch HOC (Track O1).
 * Odoo 19 boundary parity: wraps a view Controller Component, instantiates a
 * SearchModel, and connects it to the ControlPanel so the controller's
 * loadRecords always receives the current search domain/groupBy/orderBy.
 *
 * Usage:
 *   const ListWithSearch = WithSearch(ListController, { searchMenuTypes: ["filter","groupby"] });
 *   // or pass searchModel prop directly to any controller
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, onWillUnmount } = owl;
import { ControlPanel } from "./control_panel.js";

// ─── createSearchModel ────────────────────────────────────────────────────────
/** Build (or re-use) a SearchModel for a given resModel. */
export function createSearchModel(resModel, opts) {
  opts = opts || {};
  const SM =
    (window.AppCore && window.AppCore.SearchModel) ||
    (window.__ERP_SearchLayer && window.__ERP_SearchLayer.SearchModel);
  if (!SM) {
    return {
      model: resModel,
      getFacets: () => [],
      getDomain: () => [],
      getGroupBy: () => null,
      getOrderBy: () => null,
      addFacet: () => {},
      removeFacet: () => {},
      setSearchTerm: () => {},
      setGroupBy: () => {},
      subscribe: () => {},
      _stubs: true,
    };
  }
  const viewsSvc = opts.viewsSvc || (window.Services && window.Services.views) || null;
  const sm = new SM(resModel, viewsSvc, opts.state || {});
  if (opts.context) sm.applyDefaultsFromContext(opts.context);

  // Augment with getDomain/getGroupBy/getOrderBy helpers matching Odoo 19 shape
  sm.getDomain = function (actionDomain) {
    return sm.buildDomain({ actionDomain: actionDomain || [] });
  };
  sm.getGroupBy = function () {
    return sm.state.groupBy || null;
  };
  sm.getOrderBy = function () {
    return sm.state.orderBy || null;
  };
  return sm;
}

// ─── WithSearch HOC ───────────────────────────────────────────────────────────
/**
 * High-Order Component factory.
 * Returns a new OWL Component class that:
 *  1. Creates/receives a SearchModel
 *  2. Renders a ControlPanel above the inner Controller
 *  3. Re-calls controller.reload() on every search model change
 */
export function WithSearch(Controller, options) {
  options = options || {};
  const formMode = !!options.formMode;

  class WithSearchWrapper extends Component {
    static template = xml`
      <div class="o-with-search">
        <ControlPanel t-props="controlPanelProps"/>
        <t t-component="InnerController"
           t-props="innerProps"
           t-ref="innerRef"/>
      </div>`;

    static components = { ControlPanel, InnerController: Controller };

    static props = {
      resModel: String,
      resId: { type: [Number, String], optional: true },
      domain: { type: Array, optional: true },
      context: { type: Object, optional: true },
      viewType: { type: String, optional: true },
      columns: { type: Array, optional: true },
      limit: { type: Number, optional: true },
      onOpenRecord: { type: Function, optional: true },
      onSaved: { type: Function, optional: true },
      onBack: { type: Function, optional: true },
      slots: { type: Object, optional: true },
    };

    setup() {
      const resModel = this.props.resModel;
      this._sm = createSearchModel(resModel, {
        context: this.props.context,
        state: {},
      });

      var viewsChrome = [];
      if (formMode) {
        viewsChrome = [{ type: "form", label: "Form" }];
      } else if (options.searchMenuTypes) {
        viewsChrome = [{ type: "list", label: "List" }, { type: "kanban", label: "Kanban" }];
      }
      this.state = useState({
        domain: this._computeDomain(),
        breadcrumbs: [{ name: this._titleFor(resModel) }],
        availableViews: viewsChrome,
        pagerProps: null,
      });

      // Subscribe to search model changes → reload controller
      this._unsubscribe = null;
      if (typeof this._sm.subscribe === "function") {
        this._sm.subscribe(() => {
          this.state.domain = this._computeDomain();
        });
      }

      onWillUnmount(() => {
        if (typeof this._unsubscribe === "function") this._unsubscribe();
      });
    }

    _computeDomain() {
      const base = this.props.domain || [];
      if (typeof this._sm.getDomain === "function") {
        return this._sm.getDomain(base);
      }
      return base;
    }

    _titleFor(model) {
      if (!model) return formMode ? "Form" : "List";
      const parts = String(model).split(".");
      return parts[parts.length - 1]
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    get activeViewKey() {
      return this.props.viewType || (formMode ? "form" : "list");
    }

    get controlPanelProps() {
      return {
        breadcrumbs: this.state.breadcrumbs,
        views: this.state.availableViews,
        activeView: this.activeViewKey,
        searchModel: this._sm,
        onSearch: this.onSearch.bind(this),
        onViewSwitch: this.onViewSwitch.bind(this),
        pager: this.state.pagerProps || undefined,
      };
    }

    get innerProps() {
      return {
        resModel: this.props.resModel,
        resId: this.props.resId,
        domain: this.state.domain,
        context: this.props.context,
        columns: this.props.columns,
        limit: this.props.limit,
        onOpenRecord: this.props.onOpenRecord,
        onSaved: this.props.onSaved,
        onBack: this.props.onBack,
        searchModel: this._sm,
      };
    }

    onSearch({ term, facets }) {
      if (term !== undefined && typeof this._sm.setSearchTerm === "function") {
        this._sm.setSearchTerm(term);
      }
      if (Array.isArray(facets)) {
        facets.forEach((f) => this._sm.addFacet && this._sm.addFacet(f));
      }
      this.state.domain = this._computeDomain();
    }

    onViewSwitch(viewType) {
      // Emit ACTION_MANAGER:UPDATE for the new view type
      const AB = window.AppCore && window.AppCore.ActionBus;
      if (AB) {
        AB.trigger("ACTION_MANAGER:UPDATE", {
          viewType,
          resModel: this.props.resModel,
          props: { domain: this.state.domain, context: this.props.context },
        });
      }
    }
  }

  WithSearchWrapper.displayName = `WithSearch(${Controller.name || "Controller"})`;
  return WithSearchWrapper;
}

// ─── Convenience factories ────────────────────────────────────────────────────
/** Expose on AppCore so legacy code can access them. */
window.AppCore = window.AppCore || {};
window.AppCore.WithSearch = WithSearch;
window.AppCore.createSearchModel = createSearchModel;
