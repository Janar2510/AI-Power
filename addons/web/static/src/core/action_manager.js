/**
 * Action / breadcrumb stack with sessionStorage + optional URL ?stack= sync (Phase 6b).
 */
(function () {
  var STORAGE_KEY = "erp_action_stack_v1";

  function _safeParse(s) {
    try {
      return JSON.parse(s);
    } catch (e) {
      return null;
    }
  }

  function loadFromStorage() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = _safeParse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveToStorage(stack) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack || []));
    } catch (e) {}
  }

  function encodeStackQuery(stack) {
    try {
      var json = JSON.stringify(stack || []);
      return "stack=" + encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
    } catch (e) {
      return "";
    }
  }

  function decodeStackFromHash(hash) {
    try {
      var q = hash.indexOf("?");
      if (q < 0) return null;
      var params = new URLSearchParams(hash.slice(q + 1));
      var enc = params.get("stack");
      if (!enc) return null;
      var json = decodeURIComponent(escape(atob(decodeURIComponent(enc))));
      var arr = _safeParse(json);
      return Array.isArray(arr) ? arr : null;
    } catch (e) {
      return null;
    }
  }

  function mergeQueryPreservingView(baseHash, stackQuery) {
    var path = baseHash.split("?")[0];
    var params = new URLSearchParams();
    var q = baseHash.indexOf("?");
    if (q >= 0) {
      new URLSearchParams(baseHash.slice(q + 1)).forEach(function (v, k) {
        if (k !== "stack") params.set(k, v);
      });
    }
    if (stackQuery) {
      var p = stackQuery.split("=");
      if (p[0] === "stack" && p[1]) params.set("stack", decodeURIComponent(p.slice(1).join("=")));
    }
    var qs = params.toString();
    return qs ? path + "?" + qs : path;
  }

  window.ActionManager = {
    loadFromStorage: loadFromStorage,
    saveToStorage: saveToStorage,
    encodeStackQuery: encodeStackQuery,
    decodeStackFromHash: decodeStackFromHash,
    mergeQueryPreservingView: mergeQueryPreservingView,
    /** @param {{ label: string, hash: string }} entry */
    doAction: function (stack, entry) {
      var next = (stack || []).concat(entry || []);
      saveToStorage(next);
      return next;
    },
    restore: function (stack, index) {
      if (!stack || index < 0 || index >= stack.length) return stack || [];
      var next = stack.slice(0, index + 1);
      saveToStorage(next);
      return next;
    },
    syncHashWithStack: function (baseHash, stack) {
      var sq = stack && stack.length > 1 ? encodeStackQuery(stack) : "";
      if (!sq) return baseHash.split("?")[0];
      return mergeQueryPreservingView(baseHash, sq);
    },
  };
})();
