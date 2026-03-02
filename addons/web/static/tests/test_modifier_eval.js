/**
 * Unit tests for ModifierEval - Python-like modifier evaluator
 */
(function () {
  const H = window.TestHelpers;
  const M = window.ModifierEval;

  function run() {
    const results = { pass: 0, fail: 0, errors: [] };

    function test(name, fn) {
      try {
        fn();
        results.pass++;
        return true;
      } catch (e) {
        results.fail++;
        results.errors.push(name + ': ' + e.message);
        return false;
      }
    }

    test('eval empty returns true', function () {
      H.assertTrue(M.eval(''));
      H.assertTrue(M.eval('   '));
      H.assertTrue(M.eval(null));
    });

    test('eval simple true', function () {
      H.assertTrue(M.eval('1', {}));
      H.assertTrue(M.eval('true', {}));
      H.assertTrue(M.eval('ctx.x', { x: 1 }));
    });

    test('eval simple false', function () {
      H.assertFalse(M.eval('0', {}));
      H.assertFalse(M.eval('false', {}));
      H.assertFalse(M.eval('ctx.x', { x: 0 }));
    });

    test('eval context access', function () {
      H.assertTrue(M.eval('ctx.a && ctx.b', { a: 1, b: 2 }));
      H.assertFalse(M.eval('ctx.a && ctx.b', { a: 0, b: 2 }));
    });

    test('eval unsafe expr returns false', function () {
      H.assertFalse(M.eval('eval("x")', {}));
    });

    test('evalAttr returns object', function () {
      H.assertDeepEqual(M.evalAttr('{"invisible": true}', {}), { invisible: true });
      H.assertDeepEqual(M.evalAttr('{}', {}), {});
    });

    test('evalAttr invalid returns empty', function () {
      H.assertDeepEqual(M.evalAttr('', {}), {});
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.modifier_eval = run;
})();
