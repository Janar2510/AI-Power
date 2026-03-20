/**
 * AppCore.PivotView (Phase 415).
 */
(function () {
  var impl = null;
  window.AppCore = window.AppCore || {};
  window.AppCore.PivotView = {
    setImpl: function (fn) {
      impl = fn;
    },
    render: function () {
      return impl ? impl.apply(null, arguments) : false;
    },
  };
})();
