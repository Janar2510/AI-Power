(function () {
  var H = window.TestHelpers;
  var K = window.ViewRenderers && window.ViewRenderers.kanban;

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };
    function test(name, fn) {
      try {
        fn();
        results.pass += 1;
      } catch (e) {
        results.fail += 1;
        results.errors.push(name + ": " + e.message);
      }
    }

    if (!K) {
      results.fail += 1;
      results.errors.push("ViewRenderers.kanban not found");
      return results;
    }

    test("renders columns and cards", function () {
      var el = H.createContainer();
      try {
        K(el, "crm.lead", [{ id: 1, name: "A", stage_id: [10, "New"] }, { id: 2, name: "B", stage_id: [10, "New"] }], {
          stageNames: { 10: "New" },
        });
        H.assertTrue(el.querySelectorAll(".kanban-column").length >= 1);
        H.assertTrue(el.querySelectorAll(".kanban-card").length >= 2);
      } finally {
        H.removeContainer(el);
      }
    });

    test("supports fold toggle button", function () {
      var el = H.createContainer();
      try {
        K(el, "crm.lead", [{ id: 1, name: "A", stage_id: [10, "New"] }], { stageNames: { 10: "New" } });
        H.assertTrue(!!el.querySelector(".kanban-fold-toggle"));
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.kanban_renderer = run;
})();
