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

    test("autocomplete does not list all fields for unrelated short term", function () {
      var s2 = sm.getAutocompleteSuggestions("zz");
      H.assertTrue(Array.isArray(s2));
      H.assertEqual(s2.length, 0);
    });

    test("applyDefaultsFromContext adds search_default facets", function () {
      var st2 = { facets: [] };
      var sm2 = new SearchModel("crm.lead", viewsSvc, st2);
      sm2.applyDefaultsFromContext({ search_default_name: "Acme", search_default_active: true, search_default_partner_id: 42 });
      var facets = sm2.getFacets();
      H.assertTrue(facets.length >= 3);
      var d = sm2.buildDomain({
        actionDomain: [],
        model: "crm.lead",
        searchTerm: "",
        parseFilterDomain: function () { return []; },
      });
      H.assertTrue(JSON.stringify(d).indexOf("Acme") >= 0);
      H.assertTrue(JSON.stringify(d).indexOf("active") >= 0);
      H.assertTrue(JSON.stringify(d).indexOf("partner_id") >= 0);
    });

    test("applyDefaultsFromContext supports in list", function () {
      var st3 = { facets: [] };
      var sm3 = new SearchModel("x", viewsSvc, st3);
      sm3.applyDefaultsFromContext({ search_default_state: ["draft", "sent"] });
      H.assertEqual(sm3.getFacets().length, 1);
      var dom = sm3.buildDomain({ actionDomain: [], model: "x", parseFilterDomain: function () { return []; } });
      H.assertTrue(JSON.stringify(dom).indexOf("in") >= 0);
    });

    test("renderFacets and subscribe on change", function () {
      var st4 = { facets: [] };
      var sm4 = new SearchModel("res.partner", viewsSvc, st4);
      var n = 0;
      sm4.subscribe(function () {
        n += 1;
      });
      sm4.addFacet({ type: "field", name: "x", value: "y", label: "x: y", domain: [["x", "=", "y"]] });
      H.assertTrue(n >= 1);
      var html = sm4.renderFacets();
      H.assertTrue(html.indexOf("o-facet-bar") >= 0);
      H.assertTrue(html.indexOf("x: y") >= 0);
      sm4.removeFacet(0);
      H.assertTrue(sm4.renderFacets() === "");
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.search_model = run;
})();
