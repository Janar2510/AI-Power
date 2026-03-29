/**
 * Pager OWL component (Track I3).
 * Odoo 19 boundary parity: offset+limit model, inline edit, onUpdate callback.
 * Exposes AppCore.Pager.
 */

const owl = window.owl;
const { Component, useState, xml, onWillUpdateProps } = owl;

export class Pager extends Component {
  static template = xml`
    <div class="o-pager" role="navigation" aria-label="Pagination" t-att-class="{ 'o-pager--loading': props.isLoading }">
      <button type="button"
              class="o-pager-btn o-pager-btn-prev"
              aria-label="Previous page"
              t-att-disabled="atFirstPage ? '' : null"
              t-on-click="goPrev">&#8249;</button>
      <span class="o-pager-value">
        <t t-if="props.total > 0">
          <t t-esc="from"/>–<t t-esc="to"/> / <t t-esc="props.total"/>
        </t>
        <t t-else="">0</t>
      </span>
      <button type="button"
              class="o-pager-btn o-pager-btn-next"
              aria-label="Next page"
              t-att-disabled="atLastPage ? '' : null"
              t-on-click="goNext">&#8250;</button>
    </div>`;

  static props = {
    offset: Number,
    limit: Number,
    total: Number,
    onUpdate: Function,
    isLoading: { type: Boolean, optional: true },
  };

  get from() {
    return Math.min(this.props.offset + 1, this.props.total);
  }

  get to() {
    return Math.min(this.props.offset + this.props.limit, this.props.total);
  }

  get atFirstPage() {
    return this.props.offset <= 0;
  }

  get atLastPage() {
    return this.props.offset + this.props.limit >= this.props.total;
  }

  goPrev() {
    if (this.atFirstPage) return;
    const newOffset = Math.max(0, this.props.offset - this.props.limit);
    this.props.onUpdate({ offset: newOffset, limit: this.props.limit });
  }

  goNext() {
    if (this.atLastPage) return;
    const newOffset = this.props.offset + this.props.limit;
    this.props.onUpdate({ offset: newOffset, limit: this.props.limit });
  }
}

window.AppCore = window.AppCore || {};
window.AppCore.Pager = Pager;
