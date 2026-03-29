/**
 * ControlPanel OWL component (Track N1).
 * Odoo 19 boundary parity: composes breadcrumbs, SearchBar, action menus,
 * view switcher, and Pager. View controllers include this above their content.
 */

const owl = window.owl;
const { Component, useState, xml, useEnv } = owl;
import { SearchBar } from "./search_bar.js";
import { Pager } from "../core/pager.js";
import { Dropdown, DropdownItem } from "../core/dropdown.js";

// ─── Breadcrumbs ───────────────────────────────────────────────────────────────
export class Breadcrumbs extends Component {
  static template = xml`
    <nav class="o-control-panel-breadcrumbs" aria-label="Breadcrumb">
      <t t-foreach="props.breadcrumbs" t-as="crumb" t-key="crumb_index">
        <t t-if="crumb_index > 0">
          <span class="o-breadcrumb-sep" aria-hidden="true">/</span>
        </t>
        <t t-if="crumb_index < props.breadcrumbs.length - 1">
          <a class="o-breadcrumb-item"
             href="#"
             t-att-title="crumb.name"
             t-on-click.prevent="() => onCrumbClick(crumb, crumb_index)">
            <t t-esc="crumb.name"/>
          </a>
        </t>
        <t t-else="">
          <span class="o-breadcrumb-item o-breadcrumb-current" aria-current="page">
            <t t-esc="crumb.name"/>
          </span>
        </t>
      </t>
    </nav>`;

  static props = {
    breadcrumbs: Array,
    onBreadcrumbClick: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  onCrumbClick(crumb, idx) {
    if (typeof this.props.onBreadcrumbClick === "function") {
      this.props.onBreadcrumbClick(crumb, idx);
    }
  }
}

// ─── ViewSwitcher ─────────────────────────────────────────────────────────────
export class ViewSwitcher extends Component {
  static template = xml`
    <div class="o-view-switcher" role="toolbar" aria-label="View type">
      <t t-foreach="props.views" t-as="view" t-key="view.type">
        <button type="button"
                class="o-view-switcher-btn"
                t-att-class="{ 'o-view-switcher-btn--active': props.activeView === view.type }"
                t-att-aria-pressed="props.activeView === view.type ? 'true' : 'false'"
                t-att-aria-label="view.label || view.type"
                t-att-title="view.label || view.type"
                t-on-click="() => onSwitch(view.type)">
          <t t-esc="view.icon || viewIcon(view.type)"/>
        </button>
      </t>
    </div>`;

  static props = {
    views: Array,
    activeView: String,
    onViewSwitch: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  viewIcon(type) {
    const icons = { list: "≡", form: "⊞", kanban: "⬛", graph: "▦", pivot: "⊟", calendar: "📅", gantt: "═" };
    return icons[type] || type.charAt(0).toUpperCase();
  }

  onSwitch(type) {
    if (typeof this.props.onViewSwitch === "function") {
      this.props.onViewSwitch(type);
    }
  }
}

// ─── ActionMenu ───────────────────────────────────────────────────────────────
export class ActionMenu extends Component {
  static template = xml`
    <Dropdown>
      <button type="button" class="o-btn o-btn-secondary o-action-menu-btn">
        Actions &#9660;
      </button>
      <t t-set-slot="menu">
        <t t-foreach="props.items" t-as="item" t-key="item.label">
          <DropdownItem onSelected="() => item.action()">
            <t t-esc="item.label"/>
          </DropdownItem>
        </t>
      </t>
    </Dropdown>`;

  static components = { Dropdown, DropdownItem };

  static props = {
    items: Array,
    slots: { type: Object, optional: true },
  };
}

// ─── ControlPanel ─────────────────────────────────────────────────────────────
export class ControlPanel extends Component {
  static template = xml`
    <div class="o-control-panel">
      <div class="o-control-panel-main">
        <Breadcrumbs
          breadcrumbs="props.breadcrumbs || []"
          onBreadcrumbClick="props.onBreadcrumbClick"/>
        <div class="o-control-panel-center">
          <t t-if="props.views and props.views.length > 1">
            <ViewSwitcher
              views="props.views"
              activeView="props.activeView || ''"
              onViewSwitch="props.onViewSwitch"/>
          </t>
          <SearchBar
            searchModel="props.searchModel"
            searchFields="props.searchFields"
            onSearch="props.onSearch"
            searchPanelToggle="props.searchPanelToggle"
            searchPanelOpen="props.searchPanelOpen"
            onToggleSearchPanel="props.onToggleSearchPanel"/>
        </div>
        <div class="o-control-panel-actions">
          <t t-if="props.actionMenuItems and props.actionMenuItems.length">
            <ActionMenu items="props.actionMenuItems"/>
          </t>
          <t t-slot="actionButtons"/>
        </div>
      </div>
      <t t-if="hasPager">
        <div class="o-control-panel-pager">
          <Pager
            offset="props.pager.offset"
            limit="props.pager.limit"
            total="props.pager.total"
            onUpdate="props.pager.onUpdate"
            isLoading="props.pager.loading"/>
        </div>
      </t>
    </div>`;

  static components = { Breadcrumbs, ViewSwitcher, SearchBar, ActionMenu, Pager };

  static props = {
    /** Breadcrumb items: [{ name, action? }] */
    breadcrumbs: { type: Array, optional: true },
    onBreadcrumbClick: { type: Function, optional: true },
    /** Available view types: [{ type, label, icon }] */
    views: { type: Array, optional: true },
    activeView: { type: String, optional: true },
    onViewSwitch: { type: Function, optional: true },
    /** SearchBar */
    searchModel: { type: Object, optional: true },
    searchFields: { type: Array, optional: true },
    onSearch: { type: Function, optional: true },
    /** Search panel toggle button */
    searchPanelToggle: { type: Boolean, optional: true },
    searchPanelOpen: { type: Boolean, optional: true },
    onToggleSearchPanel: { type: Function, optional: true },
    /** Action menu items: [{ label, action }] */
    actionMenuItems: { type: Array, optional: true },
    /** Pager: { offset, limit, total, onUpdate, loading } */
    pager: { type: Object, optional: true },
    slots: { type: Object, optional: true },
  };

  get hasPager() {
    const p = this.props.pager;
    return p && p.total > 0;
  }
}

window.AppCore = window.AppCore || {};
Object.assign(window.AppCore, {
  ControlPanel,
  Breadcrumbs,
  ViewSwitcher,
  ActionMenu,
});
