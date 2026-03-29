/**
 * Form notebook tabs — extracted wiring (Phase 1.246 H5).
 */
(function () {
  function wire(root) {
    var scope = root || document;
    scope.querySelectorAll(".form-notebook").forEach(function (nb) {
      var tabs = nb.querySelectorAll(".notebook-tab");
      var pages = nb.querySelectorAll(".notebook-page");
      tabs.forEach(function (tab, i) {
        tab.onclick = function () {
          tabs.forEach(function (t) {
            t.classList.remove("active");
          });
          pages.forEach(function (p) {
            p.classList.remove("active");
          });
          tab.classList.add("active");
          var page = nb.querySelector('.notebook-page[data-page="' + i + '"]');
          if (page) page.classList.add("active");
        };
      });
    });
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.NotebookWidget = { wire: wire };
})();
