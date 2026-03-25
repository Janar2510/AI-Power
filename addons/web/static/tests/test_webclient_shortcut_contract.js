/**
 * Verifies frozen shortcut contract shape (Phase 600) matches main.js Alt+ behaviour.
 */
(function () {
  function sortedAltKeys(contract) {
    return (contract.alt || [])
      .map(function (x) {
        return x.key;
      })
      .sort()
      .join("");
  }

  window.Tests = window.Tests || {};
  window.Tests.webclientShortcutContract = function () {
    var pass = 0;
    var fail = 0;
    var errors = [];
    var c = window.__ERP_WEBCLIENT_SHORTCUT_CONTRACT;
    if (!c || !c.alt) {
      fail++;
      errors.push("missing __ERP_WEBCLIENT_SHORTCUT_CONTRACT.alt");
      return { pass: pass, fail: fail, errors: errors };
    }
    if (c.alt.length !== 6) {
      fail++;
      errors.push("expected 6 Alt+ shortcuts, got " + c.alt.length);
    } else {
      pass++;
    }
    var keys = sortedAltKeys(c);
    if (keys !== "eklnps") {
      fail++;
      errors.push("unexpected alt key set: " + keys);
    } else {
      pass++;
    }
    if (!c.escape || !c.escape.action) {
      fail++;
      errors.push("missing escape contract");
    } else {
      pass++;
    }
    return { pass: pass, fail: fail, errors: errors };
  };
})();
