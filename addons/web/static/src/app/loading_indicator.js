/**
 * LoadingIndicator — OWL component (1.250.10, shell/bootstrap track).
 *
 * Renders a thin indeterminate progress bar at the top of the page during RPC
 * or any async operation. Subscribers call the helpers below:
 *
 *   window.__ERP_LOADING.push()   — increment counter (show bar)
 *   window.__ERP_LOADING.pop()    — decrement counter (hide bar when 0)
 *
 * The component also responds to:
 *   CustomEvent "erp:loading:start" — push()
 *   CustomEvent "erp:loading:end"   — pop()
 *
 * Odoo 19 reference: webclient/loading_indicator/loading_indicator.js
 * Design: ui-ux-pro-max — token-based, prefers-reduced-motion safe.
 */

const owl = window.owl;
const { Component, useState, xml, onMounted, onWillUnmount } = owl;

export class LoadingIndicator extends Component {
  static template = xml`
    <div class="o-loading-bar-host" aria-hidden="true">
      <div t-if="state.count > 0"
           class="o-loading-bar"
           role="progressbar"
           aria-valuemin="0"
           aria-valuemax="100"
           aria-label="Loading"/>
    </div>
  `;

  setup() {
    this.state = useState({ count: 0 });

    this._onStart = () => { this.state.count += 1; };
    this._onEnd = () => { this.state.count = Math.max(0, this.state.count - 1); };

    onMounted(() => {
      window.addEventListener("erp:loading:start", this._onStart);
      window.addEventListener("erp:loading:end", this._onEnd);
      this._syncBus();
    });

    onWillUnmount(() => {
      window.removeEventListener("erp:loading:start", this._onStart);
      window.removeEventListener("erp:loading:end", this._onEnd);
    });
  }

  _syncBus() {
    const self = this;
    const bus = window.__ERP_LOADING;
    if (bus && typeof bus._subscribe === "function") {
      bus._subscribe(function (count) {
        self.state.count = count;
      });
    }
  }
}

/**
 * Loading counter bus — exposed as window.__ERP_LOADING.
 * Use push() / pop() in RPC layers, form/list controllers, etc.
 */
(function mountLoadingBus() {
  let _count = 0;
  const _listeners = [];

  function notify() {
    _listeners.forEach(function (fn) { fn(_count); });
  }

  window.__ERP_LOADING = {
    push() {
      _count += 1;
      notify();
      window.dispatchEvent(new CustomEvent("erp:loading:start"));
    },
    pop() {
      _count = Math.max(0, _count - 1);
      notify();
      window.dispatchEvent(new CustomEvent("erp:loading:end"));
    },
    reset() {
      _count = 0;
      notify();
    },
    get count() {
      return _count;
    },
    _subscribe(fn) {
      _listeners.push(fn);
    },
  };
})();
