/**
 * AppCore.ActivityView (Phase 415).
 */
(function () {
  var impl = null;
  window.AppCore = window.AppCore || {};
  window.AppCore.ActivityView = {
    setImpl: function (fn) {
      impl = fn;
    },
    render: function () {
      return impl ? impl.apply(null, arguments) : false;
    },
  };
})();
