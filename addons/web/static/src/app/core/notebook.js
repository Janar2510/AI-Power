/**
 * Notebook (tabbed panel) OWL component (Track I2).
 * Odoo 19 boundary parity: slot-based pages, active page state, onPageUpdate callback.
 * Exposes AppCore.Notebook.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted } = owl;

export class NotebookPage extends Component {
  static template = xml`
    <div class="o-notebook-page"
         t-att-class="{ 'o-notebook-page--active': props.isActive }"
         role="tabpanel"
         t-att-aria-labelledby="'o-nb-tab-' + props.pageId"
         t-att-id="'o-nb-panel-' + props.pageId"
         t-att-hidden="!props.isActive">
      <t t-slot="default"/>
    </div>`;

  static props = {
    pageId: String,
    isActive: Boolean,
    slots: { type: Object, optional: true },
  };
}

export class Notebook extends Component {
  static template = xml`
    <div class="o-notebook">
      <div class="o-notebook-tabs" role="tablist">
        <t t-foreach="computedPages" t-as="page" t-key="page.id">
          <button class="o-notebook-tab"
                  t-att-class="{ 'o-notebook-tab--active': state.activePage === page.id }"
                  role="tab"
                  t-att-id="'o-nb-tab-' + page.id"
                  t-att-aria-controls="'o-nb-panel-' + page.id"
                  t-att-aria-selected="state.activePage === page.id ? 'true' : 'false'"
                  t-on-click="() => activatePage(page.id)"
                  t-on-keydown="(ev) => onTabKeyDown(ev, page.id)">
            <t t-esc="page.title"/>
          </button>
        </t>
      </div>
      <div class="o-notebook-content">
        <t t-if="props.pages">
          <t t-foreach="props.pages" t-as="page" t-key="page.id">
            <NotebookPage pageId="page.id" isActive="state.activePage === page.id">
              <t t-component="page.Component" t-props="page.props"/>
            </NotebookPage>
          </t>
        </t>
        <t t-else="">
          <t t-slot="default"/>
        </t>
      </div>
    </div>`;

  static components = { NotebookPage };

  static props = {
    /** Explicit pages: [{ id, title, Component, props }] */
    pages: { type: Array, optional: true },
    defaultPage: { type: String, optional: true },
    onPageUpdate: { type: Function, optional: true },
    slots: { type: Object, optional: true },
  };

  setup() {
    const firstId = this._getFirstPageId();
    this.state = useState({ activePage: this.props.defaultPage || firstId || "" });
    onMounted(() => {
      if (!this.state.activePage && this.computedPages.length) {
        this.state.activePage = this.computedPages[0].id;
      }
    });
  }

  _getFirstPageId() {
    if (this.props.pages && this.props.pages.length) {
      return this.props.pages[0].id;
    }
    return "";
  }

  get computedPages() {
    return this.props.pages || [];
  }

  activatePage(id) {
    if (this.state.activePage === id) return;
    this.state.activePage = id;
    if (typeof this.props.onPageUpdate === "function") {
      this.props.onPageUpdate(id);
    }
  }

  onTabKeyDown(ev, id) {
    const pages = this.computedPages;
    const idx = pages.findIndex((p) => p.id === id);
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      const next = pages[(idx + 1) % pages.length];
      if (next) this.activatePage(next.id);
    } else if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      const prev = pages[(idx - 1 + pages.length) % pages.length];
      if (prev) this.activatePage(prev.id);
    }
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.Notebook = Notebook;
window.AppCore.NotebookPage = NotebookPage;
