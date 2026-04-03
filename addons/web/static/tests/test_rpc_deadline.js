/**
 * Post-1.250.8: window.__ERP_rpcRaceDeadline rejects after ms.
 */
(function () {
  window.Tests = window.Tests || {};
  window.Tests.rpc_deadline = function () {
    var errors = [];
    var pass = 0;
    var fail = 0;
    if (typeof window.__ERP_rpcRaceDeadline !== "function") {
      return { pass: 0, fail: 1, errors: ["missing __ERP_rpcRaceDeadline"] };
    }
    pass += 1;
    if (typeof window.__ERP_RPC_DEADLINE_DEFAULT_MS !== "number" || window.__ERP_RPC_DEADLINE_DEFAULT_MS <= 0) {
      return { pass: pass, fail: 1, errors: ["missing __ERP_RPC_DEADLINE_DEFAULT_MS"] };
    }
    pass += 1;
    return new Promise(function (resolve) {
      window.__ERP_rpcRaceDeadline(new Promise(function () {}), 15, "unit-timeout").then(
        function () {
          resolve({ pass: pass, fail: 1, errors: ["race should not resolve for hung promise"] });
        },
        function (err) {
          if (err && err.message === "unit-timeout") {
            pass += 1;
            resolve({ pass: pass, fail: 0, errors: [] });
          } else {
            resolve({
              pass: pass,
              fail: 1,
              errors: ["unexpected reject: " + (err && err.message ? err.message : String(err))],
            });
          }
        }
      );
    });
  };
})();
