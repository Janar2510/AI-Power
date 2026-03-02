/**
 * Unit tests for ViewRenderers.list - list view renderer
 */
(function () {
  const H = window.TestHelpers;
  const L = window.ViewRenderers && window.ViewRenderers.list;

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

    if (!L) {
      results.fail++;
      results.errors.push('ViewRenderers.list not found');
      return results;
    }

    test('render with columns and data', function () {
      const el = H.createContainer();
      try {
        L.render(el, { columns: [{ name: 'name' }, { name: 'email' }] }, [
          { id: 1, name: 'Alice', email: 'a@x.com' },
          { id: 2, name: 'Bob', email: 'b@x.com' }
        ]);
        H.assertTrue(el.querySelector('table') !== null);
        H.assertEqual(el.querySelectorAll('th').length, 3);
        H.assertEqual(el.querySelectorAll('tbody tr').length, 2);
        H.assertTrue(el.textContent.includes('Alice'));
        H.assertTrue(el.textContent.includes('Bob'));
      } finally {
        H.removeContainer(el);
      }
    });

    test('render empty data', function () {
      const el = H.createContainer();
      try {
        L.render(el, { columns: ['name'] }, []);
        H.assertEqual(el.querySelectorAll('tbody tr').length, 0);
      } finally {
        H.removeContainer(el);
      }
    });

    test('render with string columns', function () {
      const el = H.createContainer();
      try {
        L.render(el, { columns: ['name', 'id'] }, [{ id: 1, name: 'X' }]);
        H.assertTrue(el.textContent.includes('X'));
        H.assertTrue(el.textContent.includes('1'));
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.list_renderer = run;
})();
