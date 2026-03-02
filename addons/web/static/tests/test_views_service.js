/**
 * Unit tests for Services.views - with mocked fetch
 */
(function () {
  const H = window.TestHelpers;
  const Mock = window.MockRpc;
  const Views = window.Services && window.Services.views;

  function run() {
    const results = { pass: 0, fail: 0, errors: [] };

    function test(name, fn) {
      try {
        const p = fn();
        if (p && typeof p.then === 'function') {
          return p.then(function () { results.pass++; return results; })
            .catch(function (e) { results.fail++; results.errors.push(name + ': ' + (e.message || e)); return results; });
        }
        results.pass++;
        return Promise.resolve(results);
      } catch (e) {
        results.fail++;
        results.errors.push(name + ': ' + e.message);
        return Promise.resolve(results);
      }
    }

    if (!Views) {
      results.fail++;
      results.errors.push('Services.views not found');
      return Promise.resolve(results);
    }

    return test('load returns cached data from mock', function () {
      const fixture = {
        views: { 'res.partner': [{ type: 'list', columns: [{ name: 'name' }] }] },
        actions: { 'base.action_partner': { id: 'base.action_partner' } },
        menus: [{ id: 'base.menu_contacts', name: 'Contacts' }]
      };
      Mock.setLoadViewsResponse(fixture);
      Views.clearCache();
      return Views.load().then(function (data) {
        H.assertDeepEqual(data.views['res.partner'], fixture.views['res.partner']);
        H.assertDeepEqual(data.actions['base.action_partner'], fixture.actions['base.action_partner']);
        H.assertEqual(data.menus.length, 1);
      });
    }).then(function () {
      return test('getView returns view by model and type', function () {
        const fixture = {
          views: { 'res.partner': [{ type: 'list', columns: [{ name: 'name' }] }, { type: 'form', fields: [{ name: 'name' }] }] },
          actions: {},
          menus: []
        };
        Mock.setLoadViewsResponse(fixture);
        Views.clearCache();
        return Views.load().then(function () {
          const listView = Views.getView('res.partner', 'list');
          H.assertTrue(listView !== null);
          H.assertEqual(listView.type, 'list');
          const formView = Views.getView('res.partner', 'form');
          H.assertTrue(formView !== null);
          H.assertEqual(formView.type, 'form');
        });
      });
    }).then(function () {
      return test('getMenus returns menus', function () {
        const fixture = { views: {}, actions: {}, menus: [{ id: 'm1', name: 'Home' }, { id: 'm2', name: 'Contacts' }] };
        Mock.setLoadViewsResponse(fixture);
        Views.clearCache();
        return Views.load().then(function () {
          const menus = Views.getMenus();
          H.assertEqual(menus.length, 2);
          H.assertEqual(menus[0].name, 'Home');
        });
      });
    }).then(function () {
      return results;
    });
  }

  window.Tests = window.Tests || {};
  window.Tests.views_service = run;
})();
