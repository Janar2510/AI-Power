/**
 * Optional structured boot diagnostics (Odoo 19 parity / app hardening).
 * Enable: localStorage.setItem("erp_debug_mode", "1") then reload.
 */

export function erpDebugBootLog(event, detail) {
  try {
    if (typeof localStorage === "undefined" || localStorage.getItem("erp_debug_mode") !== "1") {
      return;
    }
    const payload = { ts: Date.now(), event: String(event || "unknown") };
    if (detail && typeof detail === "object") {
      Object.keys(detail).forEach(function (k) {
        payload[k] = detail[k];
      });
    }
    if (typeof console !== "undefined" && console.info) {
      console.info("[erp-debug-boot]", JSON.stringify(payload));
    }
  } catch (_e) {
    /* ignore */
  }
}
