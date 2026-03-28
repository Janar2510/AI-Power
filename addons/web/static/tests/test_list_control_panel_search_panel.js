/**
 * Phase 775: ListControlPanel.buildSearchPanelAsideHtml + SearchPanel component.
 */
(function () {
  var H = window.TestHelpers;
  var LCP = window.AppCore && window.AppCore.ListControlPanel;

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

    if (!LCP || typeof LCP.buildSearchPanelAsideHtml !== "function") {
      results.fail += 1;
      results.errors.push("ListControlPanel.buildSearchPanelAsideHtml missing");
      return results;
    }

    test("buildSearchPanelAsideHtml empty when no sections", function () {
      H.assertEqual(LCP.buildSearchPanelAsideHtml({ sections: [] }), "");
    });

    test("buildSearchPanelAsideHtml renders aside", function () {
      var html = LCP.buildSearchPanelAsideHtml({
        sections: [{ title: "T", items: [{ label: "One", value: "one" }] }],
      });
      H.assertTrue(html.indexOf("o-search-panel") >= 0);
      H.assertTrue(html.indexOf("o-search-panel-item") >= 0);
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.list_control_panel_search_panel = run;
})();
