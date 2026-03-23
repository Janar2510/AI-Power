(function () {
  var H = window.TestHelpers;
  var SearchModel = window.AppCore && window.AppCore.SearchModel;

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

    if (!SearchModel) {
      results.fail += 1;
      results.errors.push("AppCore.SearchModel not found");
      return results;
    }

    var viewsSvc = {
      getView: function () {
        return {
          filters: [{ name: "active", string: "Active", domain: '[["active","=",true]]' }],
          fields: [{ name: "name", string: "Name" }, { name: "email", string: "Email" }],
        };
      },
    };
    var state = {};
    var sm = new SearchModel("res.partner", viewsSvc, state);

    test("facet add/remove/get", function () {
      sm.addFacet({ type: "field", name: "name", value: "john", label: "Name: john", domain: [["name", "ilike", "john"]] });
      H.assertEqual(sm.getFacets().length, 1);
      sm.removeFacet(0);
      H.assertEqual(sm.getFacets().length, 0);
    });

    test("build domain merges facets", function () {
      sm.addFacet({ type: "field", name: "email", value: "@x", label: "Email: @x", domain: [["email", "ilike", "@x"]] });
      var d = sm.buildDomain({
        actionDomain: [["is_company", "=", true]],
        model: "res.partner",
        searchTerm: "",
        parseFilterDomain: function () { return []; },
      });
      H.assertTrue(JSON.stringify(d).indexOf('"email"') >= 0);
      H.assertTrue(JSON.stringify(d).indexOf('"is_company"') >= 0);
      sm.removeFacet(0);
    });

    test("autocomplete returns suggestions", function () {
      var s = sm.getAutocompleteSuggestions("jo");
      H.assertTrue(Array.isArray(s));
      H.assertTrue(s.length > 0);
      H.assertTrue((s[0].label || "").indexOf("jo") >= 0);
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.search_model = run;
})();
