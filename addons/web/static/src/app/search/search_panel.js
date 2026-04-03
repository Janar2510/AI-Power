/**
 * SearchPanel OWL component (Track N3).
 * Odoo 19 boundary parity: category/filter sections for lateral filtering.
 * Composed alongside view content within the control panel layout.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, onWillUnmount, useEnv } = owl;

export class SearchPanelSection extends Component {
  static template = xml`
    <div class="o-search-panel-section">
      <button type="button"
              class="o-search-panel-section-header"
              t-att-aria-expanded="!state.collapsed ? 'true' : 'false'"
              t-on-click="toggleCollapse">
        <span class="o-search-panel-section-title"><t t-esc="props.title"/></span>
        <span class="o-search-panel-chevron" aria-hidden="true">
          <t t-if="state.collapsed">&#9654;</t>
          <t t-else="">&#9660;</t>
        </span>
      </button>
      <t t-if="!state.collapsed">
        <div class="o-search-panel-section-items" role="list">
          <t t-foreach="props.items" t-as="item" t-key="item.id || item_index">
            <div class="o-search-panel-item"
                 t-att-class="{ 'o-search-panel-item--active': isActive(item) }"
                 role="listitem"
                 tabindex="0"
                 t-on-click="() => onItemClick(item)"
                 t-on-keydown="(ev) => onItemKeyDown(ev, item)">
              <t t-if="props.type === 'filter'">
                <input type="checkbox"
                       class="o-search-panel-checkbox"
                       t-att-checked="isActive(item) ? '' : null"
                       t-att-aria-label="item.name"
                       t-on-click.stop="() => onItemClick(item)"/>
              </t>
              <span class="o-search-panel-item-icon"
                    t-if="item.color != null"
                    t-att-style="'background:var(--color-' + item.color + ', var(--border-color))'"/>
              <span class="o-search-panel-item-label"><t t-esc="item.name || item.display_name"/></span>
              <t t-if="item.count != null">
                <span class="o-search-panel-item-count">(<t t-esc="item.count"/>)</span>
              </t>
            </div>
          </t>
        </div>
      </t>
    </div>`;

  static props = {
    title: String,
    items: Array,
    type: { type: String, optional: true }, // "category" | "filter"
    activeIds: { type: Array, optional: true },
    onToggle: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.state = useState({ collapsed: false });
  }

  isActive(item) {
    const ids = this.props.activeIds || [];
    return ids.includes(item.id);
  }

  toggleCollapse() {
    this.state.collapsed = !this.state.collapsed;
  }

  onItemClick(item) {
    if (typeof this.props.onToggle === "function") {
      this.props.onToggle(item);
    }
  }

  onItemKeyDown(ev, item) {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      this.onItemClick(item);
    }
  }
}

export class SearchPanel extends Component {
  static template = xml`
    <aside class="o-search-panel"
           role="complementary"
           aria-label="Search filters"
           t-att-class="{ 'o-search-panel--collapsed': state.collapsed }">
      <div class="o-search-panel-toggle-bar">
        <button type="button"
                class="o-search-panel-collapse-btn"
                t-att-aria-label="state.collapsed ? 'Expand search filters' : 'Collapse search filters'"
                t-on-click="toggleCollapsed">
          <t t-if="state.collapsed">&#9658;</t>
          <t t-else="">&#9664;</t>
        </button>
      </div>
      <t t-if="!state.collapsed">
        <t t-foreach="sections" t-as="section" t-key="section.id || section_index">
          <SearchPanelSection
            title="section.title"
            items="section.items || []"
            type="section.type || 'category'"
            activeIds="getActiveIds(section)"
            onToggle="(item) => onToggle(section, item)"/>
        </t>
        <t t-if="!sections.length">
          <div class="o-search-panel-empty">No filters available</div>
        </t>
      </t>
    </aside>`;

  static components = { SearchPanelSection };

  static props = {
    sections: { type: Array, optional: true },
    searchModel: { type: Object, optional: true },
    onFiltersChange: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.state = useState({
      collapsed: false,
      activeBySection: {},
      modelSections: [],
    });
    this._smUnsubscribe = null;
    onMounted(() => {
      this._bindSearchModel();
    });
    onWillUnmount(() => {
      if (typeof this._smUnsubscribe === "function") this._smUnsubscribe();
    });
  }

  get sections() {
    if (this.props.sections && this.props.sections.length) return this.props.sections;
    return this.state.modelSections;
  }

  /**
   * Bind to the SearchModel: load sections via getSearchPanelSections() and
   * subscribe so the panel refreshes whenever the model emits "change".
   */
  _bindSearchModel() {
    const sm = this.props.searchModel;
    if (!sm) return;

    this._refreshSections(sm);

    if (typeof sm.subscribe === "function") {
      sm.subscribe(() => this._refreshSections(sm));
      // Track the subscription so we can clean up
      this._smUnsubscribe = () => {
        if (sm._listeners) {
          sm._listeners = sm._listeners.filter((fn) => fn !== this._refreshSections);
        }
      };
    }
  }

  /** Pull sections from the model and mirror active filter state. */
  _refreshSections(sm) {
    const sections = typeof sm.getSearchPanelSections === "function"
      ? sm.getSearchPanelSections()
      : [];
    this.state.modelSections = sections;

    // Mirror active filters: rebuild activeBySection from sm.state.activeSearchFilters
    const activeFilters = (sm.state && sm.state.activeSearchFilters) || [];
    const bySection = {};
    sections.forEach((sec) => {
      bySection[sec.id || sec.title] = (sec.items || [])
        .filter((item) => activeFilters.includes(item.value || item.name || ""))
        .map((item) => item.id || item.value || item.name);
    });
    this.state.activeBySection = bySection;
  }

  getActiveIds(section) {
    return this.state.activeBySection[section.id || section.title] || [];
  }

  onToggle(section, item) {
    const sectionKey = section.id || section.title;
    const current = this.state.activeBySection[sectionKey] || [];
    const itemKey = item.id || item.value || item.name;
    const isActive = current.includes(itemKey);
    let next;
    if (section.type === "filter") {
      next = isActive ? current.filter((k) => k !== itemKey) : [...current, itemKey];
    } else {
      // Category: single-select (toggle off if already active)
      next = isActive ? [] : [itemKey];
    }
    this.state.activeBySection = Object.assign({}, this.state.activeBySection, { [sectionKey]: next });

    const sm = this.props.searchModel;
    if (sm) {
      const filterName = item.value || item.name || "";
      if (typeof sm.toggleFilter === "function" && filterName) {
        // Use SearchModel.toggleFilter for predefined view filters
        sm.toggleFilter(filterName);
      } else if (typeof sm.addFacet === "function" && next.length) {
        // Fallback: add a domain facet
        sm.addFacet({
          type: section.type || "filter",
          name: section.fieldName || sectionKey,
          label: `${section.title}: ${item.name || item.label || itemKey}`,
          value: next,
          domain: item.domain || null,
          removable: true,
        });
      }
    }

    if (typeof this.props.onFiltersChange === "function") {
      this.props.onFiltersChange({ section, activeIds: next });
    }
  }

  toggleCollapsed() {
    this.state.collapsed = !this.state.collapsed;
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.SearchPanel = SearchPanel;
window.AppCore.SearchPanelSection = SearchPanelSection;

// Named exports already declared via `export class` above.
