/**
 * Phase 575: navbar systray integration seam — modern bundle marks delegated systray host.
 */

export function registerNavbarFacade() {
  window.__erpNavbarFacade = {
    phase: "575",
    /** Call after systray HTML is injected into .o-systray-registry. */
    markSystrayRendered(host) {
      if (!host || !host.setAttribute) return;
      host.setAttribute("data-erp-systray-contract", "575");
    },
  };
}
