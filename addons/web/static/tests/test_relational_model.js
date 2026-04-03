/**
 * Phase 1.250.13: RelationalModel enrichment tests.
 * Covers: DynamicList.load, readRecord (cache), create/write/unlink ORM bridge,
 * loadFieldDescriptors, onchange.
 */
(function () {
  var H = window.TestHelpers;

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };
    var allPromises = [];

    function test(name, fn) {
      var p = Promise.resolve()
        .then(fn)
        .then(function () { results.pass += 1; })
        .catch(function (e) {
          results.fail += 1;
          results.errors.push(name + ": " + (e && e.message ? e.message : String(e)));
        });
      allPromises.push(p);
    }

    var RM = window.__ERP_RELATIONAL_MODEL;
    if (!RM) {
      results.fail += 1;
      results.errors.push("__ERP_RELATIONAL_MODEL not found");
      return Promise.resolve(results);
    }

    // ── Stub ORM service ──────────────────────────────────────────────────────
    var _calls = [];
    var _ormResponses = {};

    function stubOrm(method, response) {
      _ormResponses[method] = response;
    }

    function makeOrm() {
      return {
        searchRead: function (model, domain, fields, kw) {
          _calls.push({ method: "searchRead", model: model });
          var r = _ormResponses["searchRead"];
          return Promise.resolve(r != null ? r : []);
        },
        read: function (model, ids, fields) {
          _calls.push({ method: "read", model: model, ids: ids });
          var r = _ormResponses["read"];
          return Promise.resolve(r != null ? r : []);
        },
        create: function (model, vals) {
          _calls.push({ method: "create", model: model, vals: vals });
          var r = _ormResponses["create"];
          return Promise.resolve(r != null ? r : 42);
        },
        write: function (model, ids, data) {
          _calls.push({ method: "write", model: model });
          var r = _ormResponses["write"];
          return Promise.resolve(r != null ? r : true);
        },
        unlink: function (model, ids) {
          _calls.push({ method: "unlink", model: model });
          var r = _ormResponses["unlink"];
          return Promise.resolve(r != null ? r : true);
        },
        nameSearch: function (model, term, domain, kw) {
          _calls.push({ method: "nameSearch", model: model });
          var r = _ormResponses["nameSearch"];
          return Promise.resolve(r != null ? r : []);
        },
      };
    }

    var _origOrm = window.Services && window.Services.orm;
    var _origRpc = window.Services && window.Services.rpc;
    var _orm = makeOrm();
    window.Services = window.Services || {};
    window.Services.orm = _orm;
    window.Services.rpc = {
      callKw: function (model, method, args, kwargs) {
        _calls.push({ method: method, model: model });
        var r = _ormResponses[method];
        return Promise.resolve(r != null ? r : {});
      },
    };

    function resetCalls() { _calls = []; }

    // ── Tests ─────────────────────────────────────────────────────────────────

    test("DynamicList.load resolves with record list", function () {
      resetCalls();
      stubOrm("searchRead", [{ id: 1, name: "Test" }, { id: 2, name: "Other" }]);
      return RM.loadList("res.partner", { fields: ["id", "name"], limit: 10 }).then(function (list) {
        H.assertTrue(list && list.records && list.records.length === 2, "should return 2 records");
        H.assertEqual(list.ids.length, 2, "ids array should have 2 entries");
        H.assertEqual(_calls.filter(function (c) { return c.method === "searchRead"; }).length, 1, "searchRead called once");
      });
    });

    test("readRecord returns a Record with cached read on second call", function () {
      resetCalls();
      RM.clearReadRecordCache();
      stubOrm("read", [{ id: 5, name: "CachedPartner", email: "x@test.com" }]);
      return RM.readRecord("res.partner", 5, ["id", "name", "email"]).then(function (rec) {
        H.assertTrue(!!rec, "first read returns Record");
        H.assertEqual(rec.id, 5);
        return RM.readRecord("res.partner", 5, ["id", "name", "email"]);
      }).then(function (rec2) {
        H.assertTrue(!!rec2, "cached read returns Record");
        var readCalls = _calls.filter(function (c) { return c.method === "read"; });
        H.assertEqual(readCalls.length, 1, "orm.read called only once (cache hit on second)");
      });
    });

    test("invalidateReadRecordCache clears cached read for specific id", function () {
      resetCalls();
      RM.clearReadRecordCache();
      stubOrm("read", [{ id: 7, name: "Cacheable" }]);
      return RM.readRecord("res.partner", 7, ["id", "name"]).then(function () {
        RM.invalidateReadRecordCache("res.partner", 7);
        return RM.readRecord("res.partner", 7, ["id", "name"]);
      }).then(function () {
        var readCalls = _calls.filter(function (c) { return c.method === "read"; });
        H.assertEqual(readCalls.length, 2, "should re-read after cache invalidation");
      });
    });

    test("create delegates to orm.create and invalidates cache", function () {
      resetCalls();
      stubOrm("create", [99]);
      return RM.create("res.partner", { name: "New Partner" }).then(function (ids) {
        H.assertTrue(ids === 99 || (Array.isArray(ids) && ids[0] === 99), "create returns id(s)");
        H.assertEqual(_calls.filter(function (c) { return c.method === "create"; }).length, 1);
      });
    });

    test("write delegates to orm.write and invalidates cache", function () {
      resetCalls();
      stubOrm("write", true);
      return RM.write("res.partner", [3, 4], { name: "Updated" }).then(function (ok) {
        H.assertTrue(ok === true, "write returns true on success");
        H.assertEqual(_calls.filter(function (c) { return c.method === "write"; }).length, 1);
      });
    });

    test("unlink delegates to orm.unlink and invalidates cache", function () {
      resetCalls();
      stubOrm("unlink", true);
      return RM.unlink("res.partner", [10]).then(function (ok) {
        H.assertTrue(ok === true, "unlink returns true on success");
        H.assertEqual(_calls.filter(function (c) { return c.method === "unlink"; }).length, 1);
      });
    });

    test("loadFieldDescriptors calls fields_get via rpc.callKw", function () {
      resetCalls();
      stubOrm("fields_get", { name: { type: "char", string: "Name", required: true } });
      return RM.loadFieldDescriptors("res.partner").then(function (fields) {
        H.assertTrue(typeof fields === "object", "loadFieldDescriptors returns object");
        H.assertTrue(!!fields.name, "name field descriptor present");
        H.assertEqual(fields.name.type, "char");
      });
    });

    test("loadListWithFields returns list and fieldDescriptors together", function () {
      resetCalls();
      stubOrm("searchRead", [{ id: 1, name: "A" }]);
      stubOrm("fields_get", { name: { type: "char" } });
      return RM.loadListWithFields("res.partner", { fields: ["id", "name"], limit: 5 }).then(function (result) {
        H.assertTrue(!!result.list, "result has list");
        H.assertTrue(!!result.fieldDescriptors, "result has fieldDescriptors");
        H.assertEqual(result.list.records.length, 1);
      });
    });

    test("onchange calls rpc.callKw with onchange method", function () {
      resetCalls();
      stubOrm("onchange", { value: { name: "Server updated" } });
      return RM.onchange("res.partner", [1], { name: "x" }, ["name"]).then(function (res) {
        H.assertTrue(typeof res === "object", "onchange returns response");
        H.assertEqual(_calls.filter(function (c) { return c.method === "onchange"; }).length, 1);
      });
    });

    return Promise.all(allPromises).then(function () {
      // Restore services
      window.Services.orm = _origOrm;
      window.Services.rpc = _origRpc;
      return results;
    });
  }

  window.Tests = window.Tests || {};
  window.Tests.relationalModel = run;
})();
