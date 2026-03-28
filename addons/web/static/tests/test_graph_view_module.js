/**
 * Unit tests for AppCore.GraphViewModule (Phase 754).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.GraphViewModule;

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
      results.errors.push("AppCore.GraphViewModule.render not found");
      return results;
    }

    test("render outputs graph canvas and calls Chart when available", function () {
      const el = H.createContainer();
      const prevChart = window.Chart;
      let chartCalled = false;
      window.Chart = function () {
        chartCalled = true;
      };
      let listState = { route: "leads", stageFilter: null };
      try {
        const handled = M.render(el, {
          model: "res.partner",
          route: "contacts",
          graphView: { graph_type: "bar", fields: [] },
          rows: [{ stage_id: 1, x: 5 }],
          groupbyField: "stage_id",
          measureFields: ["x"],
          labelMap: { 1: "A" },
          searchTerm: "",
          savedFiltersList: [],
          getTitle: function () {
            return "Contacts";
          },
          renderViewSwitcher: function () {
            return "";
          },
          loadRecords: function () {},
          dispatchListActWindowThenFormHash: function () {},
          setViewAndReload: function () {},
          getListState: function () {
            return listState;
          },
          setListState: function (s) {
            listState = s;
          },
          setActionStack: function () {},
          rpc: { callKw: function () {
            return Promise.resolve([]);
          } },
          rerenderGraph: function () {},
        });
        H.assertTrue(handled);
        H.assertTrue(!!el.querySelector("#graph-canvas"));
        H.assertTrue(chartCalled);
      } finally {
        window.Chart = prevChart;
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.graph_view_module = run;
})();
