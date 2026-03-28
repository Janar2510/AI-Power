/**
 * Unit tests for AppCore.KanbanViewModule (Phase 747).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.KanbanViewModule;

  function run() {
    const results = { pass: 0, fail: 0, errors: [] };

    function test(name, fn) {
      try {
        fn();
        results.pass++;
      } catch (e) {
        results.fail++;
        results.errors.push(name + ": " + e.message);
      }
    }

    if (!M || typeof M.render !== "function") {
      results.fail++;
      results.errors.push("AppCore.KanbanViewModule.render not found");
      return results;
    }

    test("render outputs kanban shell with kanban-area", function () {
      const el = H.createContainer();
      const prevVR = window.ViewRenderers;
      let kanbanCalled = false;
      window.ViewRenderers = {
        kanban: function (area) {
          kanbanCalled = !!area;
        },
      };
      let state = { route: "", viewType: "list" };
      let stack = null;
      try {
        const handled = M.render(el, {
          model: "product.template",
          route: "products",
          records: [],
          searchTerm: "",
          viewsSvc: null,
          rpc: {
            callKw: function () {
              return Promise.resolve([]);
            },
          },
          showToast: function () {},
          getTitle: function () {
            return "Products";
          },
          renderViewSwitcher: function () {
            return '<button type="button" class="btn-view" data-view="list">List</button>';
          },
          dispatchListActWindowThenFormHash: function () {},
          loadRecords: function () {},
          setViewAndReload: function () {},
          getListState: function () {
            return state;
          },
          setListState: function (s) {
            state = s;
          },
          setActionStack: function (s) {
            stack = s;
          },
        });
        H.assertTrue(handled);
        const area = el.querySelector("#kanban-area");
        H.assertTrue(!!area);
        H.assertTrue(kanbanCalled);
        H.assertTrue(!!stack && stack.length === 1 && stack[0].hash === "products");
        H.assertTrue(state.model === "product.template" && state.route === "products");
      } finally {
        window.ViewRenderers = prevVR;
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.kanban_view_module = run;
})();
