/**
 * Lightweight component lifecycle + signal-style state (Phase 489).
 * Must be IIFE + window assignment: web.assets_web is concatenated (not ES modules).
 */
(function () {
  'use strict';

  /**
   * Minimal reactive cell (read/write + subscribers).
   * @param {*} initial
   */
  function createSignal(initial) {
    var value = initial;
    var subs = new Set();
    return {
      read: function () {
        return value;
      },
      write: function (next) {
        if (Object.is(next, value)) return;
        value = next;
        subs.forEach(function (fn) {
          try {
            fn();
          } catch (_e) {
            /* ignore subscriber errors */
          }
        });
      },
      subscribe: function (fn) {
        subs.add(fn);
        return function () {
          subs.delete(fn);
        };
      },
    };
  }

  function ComponentBase(el) {
    this.el = el;
    this._cleanups = [];
  }
  ComponentBase.prototype.mount = function () {};
  ComponentBase.prototype.update = function (_nextProps) {};
  ComponentBase.prototype.destroy = function () {
    var c = this._cleanups.splice(0);
    for (var i = 0; i < c.length; i++) {
      try {
        c[i]();
      } catch (_e) {
        /* ignore */
      }
    }
    this.el = null;
  };
  ComponentBase.prototype._onDestroy = function (fn) {
    this._cleanups.push(fn);
  };

  window.AppCore = window.AppCore || {};
  window.AppCore.createSignal = createSignal;
  window.AppCore.ComponentBase = ComponentBase;
})();
