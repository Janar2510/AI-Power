/**
 * Post-1.250.8: shared Promise.race deadline for hung JSON-RPC fetch chains.
 * OWL controllers and other callers use window.__ERP_rpcRaceDeadline(promise, ms?, label?).
 * Does not abort TCP; pairs with user-visible error + Retry (see list/form controllers).
 */
(function () {
  var DEFAULT_MS = 25000;

  /**
   * @param {Promise<*>} promise
   * @param {number} [ms]
   * @param {string} [label]
   * @returns {Promise<*>}
   */
  function race(promise, ms, label) {
    var d = ms == null ? DEFAULT_MS : ms;
    var msg = label || "Request timed out";
    return Promise.race([
      Promise.resolve(promise),
      new Promise(function (_, rej) {
        setTimeout(function () {
          rej(new Error(msg));
        }, d);
      }),
    ]);
  }

  window.__ERP_rpcRaceDeadline = race;
  window.__ERP_RPC_DEADLINE_DEFAULT_MS = DEFAULT_MS;
})();
