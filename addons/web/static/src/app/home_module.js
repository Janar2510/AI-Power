/**
 * Registers `AppCore.HomeModule` metadata bridge for the modular runtime.
 * Full `renderHome` / KPI wiring remains in legacy `main.js` until further extraction.
 */
import { getDataRouteSlugs, getRouteLegacy } from "./router.js";

export function registerHomeModule() {
  window.AppCore = window.AppCore || {};
  window.AppCore.HomeModule = {
    getDataRouteSlugs,
    getRouteLegacy,
    describe: "App launcher + dashboard: legacy main.js + AppCore.Dashboard / DashboardKpiStrip",
  };
}
