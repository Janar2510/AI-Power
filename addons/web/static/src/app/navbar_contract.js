/**
 * Phase 566: explicit contract marker for navbar ownership — modern shell delegates
 * rendering to legacy AppCore.Navbar while the modular runtime owns the integration boundary.
 */

export function registerNavbarContract() {
  window.__erpNavbarContract = {
    phase: "566",
    /** Legacy/AppCore.Navbar should call after writing chrome into the host slot. */
    markDelegated(host) {
      if (!host || !host.setAttribute) return;
      host.setAttribute("data-erp-navbar-contract", "566");
      host.setAttribute("data-erp-navbar-owner", "modern-delegated");
    },
  };
}
