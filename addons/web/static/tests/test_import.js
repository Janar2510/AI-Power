(function () {
  var H = window.TestHelpers;
  var I = window.AppCore && window.AppCore.Import;

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };
    function test(name, fn) {
      try {
        var out = fn();
        if (out && typeof out.then === "function") {
          return out.then(function () { results.pass += 1; }).catch(function (e) { results.fail += 1; results.errors.push(name + ": " + e.message); });
        }
        results.pass += 1;
      } catch (e) {
        results.fail += 1;
        results.errors.push(name + ": " + e.message);
      }
      return Promise.resolve();
    }

    if (!I) {
      results.fail += 1;
      results.errors.push("AppCore.Import not found");
      return Promise.resolve(results);
    }

    var tasks = [];
    tasks.push(test("parseCsv handles quotes", function () {
      var rows = I.parseCsv('name,email\n"A, B",a@example.com');
      H.assertEqual(rows.length, 2);
      H.assertEqual(rows[1][0], "A, B");
    }));
    tasks.push(test("runBatchImport maps rows", function () {
      var rpc = {
        callKw: function () { return Promise.resolve({ created: 2, errors: [] }); },
      };
      return I.runBatchImport(rpc, "res.partner", ["name", "email"], [["A", "a@x.com"], ["B", "b@x.com"]], { 0: "name", 1: "email" }).then(function (res) {
        H.assertEqual(res.created, 2);
      });
    }));

    return Promise.all(tasks).then(function () { return results; });
  }

  window.Tests = window.Tests || {};
  window.Tests.import_core = run;
})();
