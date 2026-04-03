/**
 * Breadcrumb Engine — action-stack management (Phase 1.250.15).
 *
 * Extracted from the main.js IIFE.  Owns the in-memory actionStack and
 * provides push/pop/sync helpers.  main.js delegates all breadcrumb
 * operations to window.__ERP_BreadcrumbEngine.
 *
 * Public surface (window.__ERP_BreadcrumbEngine):
 *   push(label, hash)
 *   popTo(index)
 *   reset(title, route)
 *   syncHashIfMulti(route)
 *   applyForList(route, title)
 *   getStack() → [{label, hash}]
 *   setStack(arr)
 */
(function () {
  "use strict";

  var _actionStack = [];

  function _saveToStorage(stack) {
    if (window.ActionManager && typeof window.ActionManager.saveToStorage === "function") {
      window.ActionManager.saveToStorage(stack);
    }
  }

  function push(label, hash) {
    _actionStack.push({ label: label, hash: hash });
    _saveToStorage(_actionStack);
  }

  function popTo(index) {
    if (index < _actionStack.length) {
      _actionStack = _actionStack.slice(0, index + 1);
      _saveToStorage(_actionStack);
      var entry = _actionStack[_actionStack.length - 1];
      if (entry) {
        var h = entry.hash;
        if (window.ActionManager && _actionStack.length > 1 &&
            typeof window.ActionManager.syncHashWithStack === "function") {
          h = window.ActionManager.syncHashWithStack(h, _actionStack);
        }
        window.location.hash = h;
      }
    }
  }

  function reset(title, route) {
    _actionStack = [{ label: title, hash: route }];
    _saveToStorage(_actionStack);
  }

  function syncHashIfMulti(route) {
    if (!_actionStack || _actionStack.length <= 1) return;
    if (!window.ActionManager || typeof window.ActionManager.syncHashWithStack !== "function") return;
    var cur = window.location.hash.slice(1);
    var routeBase = String(route || "").split("?")[0];
    var curBase = cur.split("?")[0];
    var baseWithQuery = curBase === routeBase ? cur : String(route || "");
    var next = window.ActionManager.syncHashWithStack(baseWithQuery, _actionStack);
    if (!next || next === cur) return;
    window.location.replace("#" + next);
  }

  function applyForList(route, title) {
    var hashFull = String(window.location.hash || "").replace(/^#/, "");
    if (
      hashFull.indexOf("stack=") >= 0 &&
      window.ActionManager &&
      typeof window.ActionManager.decodeStackFromHash === "function"
    ) {
      var decPreserve = window.ActionManager.decodeStackFromHash(hashFull);
      if (decPreserve && decPreserve.length > 1) {
        var brP = String(route || "").split("?")[0];
        var lastP = decPreserve[decPreserve.length - 1];
        var lbP = String(lastP && lastP.hash ? lastP.hash : "").split("?")[0];
        if (lbP === brP) {
          _actionStack = decPreserve.slice();
          var leafP = _actionStack[_actionStack.length - 1];
          leafP.label = title;
          leafP.hash = route;
          _saveToStorage(_actionStack);
          return;
        }
      }
    }
    var pending = window.__ERP_PENDING_LIST_NAV_SOURCE || null;
    window.__ERP_PENDING_LIST_NAV_SOURCE = null;
    var appendChrome = pending === "sidebar" || pending === "selectApp" || pending === "navigateFromMenu";
    var baseRoute = String(route || "").split("?")[0];
    if (appendChrome && _actionStack.length > 0) {
      var last = _actionStack[_actionStack.length - 1];
      var lastBase = String(last.hash || "").split("?")[0];
      if (lastBase === baseRoute) {
        last.label = title;
        _saveToStorage(_actionStack);
        syncHashIfMulti(route);
        return;
      }
      _actionStack = _actionStack.concat([{ label: title, hash: route }]);
      _saveToStorage(_actionStack);
      syncHashIfMulti(route);
      return;
    }
    reset(title, route);
    syncHashIfMulti(route);
  }

  function getStack() {
    return _actionStack.slice();
  }

  function setStack(arr) {
    _actionStack = Array.isArray(arr) ? arr.slice() : [];
  }

  var BreadcrumbEngine = {
    push: push,
    popTo: popTo,
    reset: reset,
    syncHashIfMulti: syncHashIfMulti,
    applyForList: applyForList,
    getStack: getStack,
    setStack: setStack,
  };

  window.__ERP_BreadcrumbEngine = BreadcrumbEngine;
})();
