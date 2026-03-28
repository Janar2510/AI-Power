/**
 * Unit tests for AppCore.PivotViewModule (Phase 756).
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.PivotViewModule;

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
      results.errors.push("AppCore.PivotViewModule.render not found");
      return results;
    }

    test("render outputs o-pivot-table matrix", function () {
      const el = H.createContainer();
      let listState = { route: "leads" };
      try {
        const rows = [
          { stage_id: 10, user_id: 20, expected_revenue: 100 },
          { stage_id: 10, user_id: 21, expected_revenue: 50 },
        ];
        const handled = M.render(el, {
          model: "crm.lead",
          route: "leads",
          pivotView: { fields: [] },
          rows: rows,
          rowNames: ["stage_id"],
          colNames: ["user_id"],
          measures: ["expected_revenue"],
          rowLabelMap: { 10: "New" },
          colLabelMap: { 20: "U1", 21: "U2" },
          searchTerm: "",
          savedFiltersList: [],
          getTitle: function () {
            return "Leads";
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
          rerenderPivot: function () {},
        });
        H.assertTrue(handled);
        const tbl = el.querySelector(".o-pivot-table");
        H.assertTrue(!!tbl);
        H.assertTrue(tbl.querySelector(".o-pivot-th--measure") !== null);
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.pivot_view_module = run;
})();
