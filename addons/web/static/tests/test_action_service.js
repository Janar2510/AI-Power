/**
 * Unit tests for Services.action - action manager
 */
(function () {
  const H = window.TestHelpers;
  const Action = window.Services && window.Services.action;

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

    if (!Action) {
      results.fail++;
      results.errors.push('Services.action not found');
      return results;
    }

    test('doAction window returns resModel', function () {
      const result = Action.doAction({
        type: 'ir.actions.act_window',
        res_model: 'res.partner',
        view_mode: 'list,form'
      });
      H.assertEqual(result.type, 'window');
      H.assertEqual(result.resModel, 'res.partner');
      H.assertEqual(result.viewMode, 'list,form');
    });

    test('doAction url sets hash', function () {
      const before = window.location.hash;
      Action.doAction({ type: 'ir.actions.act_url', url: '#contacts' });
      H.assertEqual(window.location.hash, '#contacts');
      window.location.hash = before;
    });

    test('doAction client returns client type', function () {
      const result = Action.doAction({ type: 'ir.actions.act_client', tag: 'my_tag' });
      H.assertEqual(result.type, 'client');
      H.assertEqual(result.tag, 'my_tag');
    });

    test('getClientAction returns home handler', function () {
      H.assertTrue(typeof Action.getClientAction('home') === 'function');
    });

    test('doAction report opens html url', function () {
      const calls = [];
      const orig = window.open;
      window.open = function (url) {
        calls.push(url);
      };
      try {
        const result = Action.doAction(
          { type: 'ir.actions.report', report_name: 'account.report_invoice', res_id: 5 },
          {}
        );
        H.assertEqual(result.type, 'report');
        H.assertTrue(calls.length === 1 && calls[0].indexOf('/report/html/') >= 0);
      } finally {
        window.open = orig;
      }
    });

    test('doAction unknown type rejects', function () {
      try {
        Action.doAction({ type: 'ir.actions.unknown' });
        H.assertTrue(false, 'Should have thrown');
      } catch (e) {
        H.assertTrue(e.message.includes('Unknown action type'));
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.action_service = run;
})();
