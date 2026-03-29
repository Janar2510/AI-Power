/**
 * CalendarController OWL component (Track J4).
 * Delegates to AppCore.CalendarViewModule.
 */

const owl = window.owl;
const { Component, xml, onMounted, useRef, useEnv } = owl;
import { viewRegistry } from "../view_registry.js";

export class CalendarController extends Component {
  static template = xml`
    <div class="o-calendar-controller o-calendar-view">
      <div class="o-calendar-toolbar" t-ref="toolbar"/>
      <div class="o-calendar-content" t-ref="content"/>
    </div>`;

  static props = {
    resModel: String,
    domain: { type: Array, optional: true },
    context: { type: Object, optional: true },
    mode: { type: String, optional: true }, // month | week | day
    slots: { type: Object, optional: true },
  };

  setup() {
    this.env = useEnv();
    this.contentRef = useRef("content");
    onMounted(() => this._renderLegacy());
  }

  _renderLegacy() {
    const CVM = window.AppCore && window.AppCore.CalendarViewModule;
    const el = this.contentRef.el;
    if (!el) return;
    if (CVM && typeof CVM.render === "function") {
      CVM.render(el, {
        model: this.props.resModel,
        domain: this.props.domain || [],
        mode: this.props.mode || "month",
        rpc: window.Services && window.Services.rpc,
      });
    } else {
      el.innerHTML = '<p class="o-skeleton-msg">Calendar view loading…</p>';
    }
  }
}

viewRegistry.add("calendar", {
  type: "calendar",
  Controller: CalendarController,
  searchMenuTypes: ["filter", "favorite"],
});

window.AppCore = window.AppCore || {};
window.AppCore.CalendarController = CalendarController;
