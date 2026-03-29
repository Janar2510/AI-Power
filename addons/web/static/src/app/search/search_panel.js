/**
 * SearchPanel OWL component (Track N3).
 * Odoo 19 boundary parity: category/filter sections for lateral filtering.
 * Composed alongside view content within the control panel layout.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, useEnv } = owl;

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
                    t-att-style="'background:var(--color-' + item.color + ', #ccc)'"/>
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
    });
    onMounted(() => {
      this._loadSectionsFromModel();
    });
  }

  get sections() {
    if (this.props.sections) return this.props.sections;
    return this.state.modelSections || [];
  }

  _loadSectionsFromModel() {
    const sm = this.props.searchModel;
    if (!sm) return;
    // Try to load search view sections from the model's getSearchView()
    const searchView = typeof sm.getSearchView === "function" ? sm.getSearchView() : null;
    if (!searchView) return;
    // Future: parse searchView arch XML for filter/category elements
    this.state.modelSections = [];
  }

  getActiveIds(section) {
    return (this.state.activeBySection[section.id] || []);
  }

  onToggle(section, item) {
    const current = this.state.activeBySection[section.id] || [];
    const isActive = current.includes(item.id);
    let next;
    if (section.type === "filter") {
      // Multi-select
      next = isActive ? current.filter((id) => id !== item.id) : [...current, item.id];
    } else {
      // Category: single-select (or deselect)
      next = isActive ? [] : [item.id];
    }
    this.state.activeBySection = Object.assign({}, this.state.activeBySection, { [section.id]: next });

    // Notify SearchModel
    const sm = this.props.searchModel;
    if (sm && typeof sm.addFacet === "function") {
      if (next.length) {
        sm.addFacet({
          type: section.type || "filter",
          name: section.fieldName || section.id,
          label: `${section.title}: ${item.name || item.id}`,
          value: next,
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
