/**
 * SearchBar OWL component (Track N2).
 * Odoo 19 boundary parity: autocomplete suggestions, facet chips, toggler for SearchPanel.
 * Wired to SearchModel for domain/groupBy/orderBy computation.
 */

const owl = window.owl;
const { Component, useState, xml, useRef, useEnv, onWillUnmount } = owl;
import { useDebounce, useExternalListener } from "../core/hooks.js";

export class SearchBar extends Component {
  static template = xml`
    <div class="o-search-bar-owl" role="search">
      <div class="o-search-bar-facets">
        <t t-foreach="facets" t-as="facet" t-key="facet_index">
          <span class="o-facet-chip">
            <t t-if="facet.type and facet.type !== 'custom'">
              <span class="o-facet-type-label"><t t-esc="facet.type"/>&nbsp;&#x2192;&nbsp;</span>
            </t>
            <span class="o-facet-chip-label" t-att-title="facet.label"><t t-esc="facet.label"/></span>
            <t t-if="facet.value != null">
              <span class="o-facet-chip-value">: <t t-esc="facet.value"/></span>
            </t>
            <t t-if="facet.removable !== false">
              <button type="button"
                      class="o-facet-chip-remove"
                      t-att-aria-label="'Remove filter: ' + facet.label"
                      t-on-click="() => removeFacet(facet_index)">&#x2715;</button>
            </t>
          </span>
        </t>
        <input t-ref="input"
               type="text"
               class="o-search-bar-input"
               t-att-value="state.term"
               placeholder="Search…"
               aria-label="Search"
               autocomplete="off"
               t-att-aria-expanded="state.suggestionsOpen ? 'true' : 'false'"
               aria-haspopup="listbox"
               t-on-input="onInput"
               t-on-keydown="onKeyDown"
               t-on-focus="onFocus"
               t-on-blur="onBlur"/>
      </div>
      <button type="button"
              class="o-btn o-btn-primary o-search-bar-submit"
              aria-label="Search"
              t-on-click="onSearch">
        &#128269;
      </button>
      <t t-if="props.searchPanelToggle">
        <button type="button"
                class="o-btn o-btn-secondary o-search-panel-toggle"
                t-att-class="{ 'active': props.searchPanelOpen }"
                aria-label="Toggle search panel"
                t-on-click="props.onToggleSearchPanel">
          &#9776;
        </button>
      </t>
      <t t-if="state.suggestionsOpen and state.suggestions.length">
        <ul class="o-search-suggestions" role="listbox" aria-label="Search suggestions">
          <t t-foreach="state.suggestions" t-as="suggestion" t-key="suggestion_index">
            <li class="o-search-suggestion"
                t-att-class="{ 'o-search-suggestion--active': state.activeSuggestion === suggestion_index }"
                role="option"
                t-att-aria-selected="state.activeSuggestion === suggestion_index ? 'true' : 'false'"
                t-on-mousedown.prevent="() => applySuggestion(suggestion)">
              <span class="o-suggestion-type"><t t-esc="suggestion.type || 'Search'"/></span>
              <span class="o-suggestion-label"><t t-esc="suggestion.label"/></span>
            </li>
          </t>
        </ul>
      </t>
    </div>`;

  static props = {
    searchModel: { type: Object, optional: true },
    onSearch: { type: Function, optional: true },
    searchFields: { type: Array, optional: true },
    searchPanelToggle: { type: Boolean, optional: true },
    searchPanelOpen: { type: Boolean, optional: true },
    onToggleSearchPanel: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    this.inputRef = useRef("input");
    this.state = useState({
      term: "",
      suggestions: [],
      suggestionsOpen: false,
      activeSuggestion: -1,
    });
    this._debouncedSuggest = useDebounce(this._buildSuggestions.bind(this), 200);
    useExternalListener(document, "click", this.onDocumentClick.bind(this));
  }

  get facets() {
    const sm = this.props.searchModel;
    if (sm && typeof sm.getFacets === "function") {
      return sm.getFacets();
    }
    return [];
  }

  onInput(ev) {
    this.state.term = ev.target.value;
    if (this.state.term.length >= 1) {
      this._debouncedSuggest(this.state.term);
    } else {
      this.state.suggestions = [];
      this.state.suggestionsOpen = false;
    }
  }

  onFocus() {
    if (this.state.term.length >= 1) {
      this._debouncedSuggest(this.state.term);
    }
  }

  onBlur() {
    // Close is handled by document click (mousedown.prevent above prevents blur race)
  }

  _buildSuggestions(term) {
    const suggestions = [];
    // 1. Simple text search suggestion
    suggestions.push({ type: "Search", label: term, facet: { type: "search", label: term, value: term } });
    // 2. Search field suggestions from searchFields prop
    const fields = this.props.searchFields || [];
    fields.forEach((field) => {
      if (!field || !field.label) return;
      suggestions.push({
        type: field.label,
        label: term,
        facet: {
          type: "field",
          name: field.name,
          operator: field.operator || "ilike",
          value: term,
          label: `${field.label}: ${term}`,
          removable: true,
        },
      });
    });
    this.state.suggestions = suggestions;
    this.state.suggestionsOpen = true;
    this.state.activeSuggestion = suggestions.length > 0 ? 0 : -1;
  }

  onKeyDown(ev) {
    const { suggestions, activeSuggestion, suggestionsOpen } = this.state;
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      this.state.activeSuggestion = Math.min(activeSuggestion + 1, suggestions.length - 1);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      this.state.activeSuggestion = Math.max(activeSuggestion - 1, 0);
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (suggestionsOpen && suggestions[activeSuggestion]) {
        this.applySuggestion(suggestions[activeSuggestion]);
      } else {
        this.onSearch();
      }
    } else if (ev.key === "Escape") {
      this.closeList();
    } else if (ev.key === "Backspace" && !this.state.term) {
      // Remove last facet
      const facets = this.facets;
      if (facets.length) this.removeFacet(facets.length - 1);
    }
  }

  applySuggestion(suggestion) {
    const sm = this.props.searchModel;
    if (sm && suggestion.facet && typeof sm.addFacet === "function") {
      sm.addFacet(suggestion.facet);
    }
    this.state.term = "";
    this.closeList();
    if (this.inputRef.el) this.inputRef.el.value = "";
    this._triggerSearch();
  }

  removeFacet(idx) {
    const sm = this.props.searchModel;
    if (sm && typeof sm.removeFacet === "function") {
      sm.removeFacet(idx);
      this._triggerSearch();
    }
  }

  onSearch() {
    const term = this.state.term;
    if (term) {
      const sm = this.props.searchModel;
      if (sm && typeof sm.setSearchTerm === "function") {
        sm.setSearchTerm(term);
      }
    }
    this.state.term = "";
    if (this.inputRef.el) this.inputRef.el.value = "";
    this.closeList();
    this._triggerSearch();
  }

  _triggerSearch() {
    if (typeof this.props.onSearch === "function") {
      const sm = this.props.searchModel;
      const domain = sm && typeof sm.getDomain === "function" ? sm.getDomain() : [];
      this.props.onSearch({ domain, term: this.state.term });
    }
  }

  closeList() {
    this.state.suggestionsOpen = false;
  }

  onDocumentClick(ev) {
    if (!this.state.suggestionsOpen) return;
    const input = this.inputRef.el;
    const root = input && input.closest(".o-search-bar-owl");
    if (root && !root.contains(ev.target)) this.closeList();
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.SearchBarOWL = SearchBar;
