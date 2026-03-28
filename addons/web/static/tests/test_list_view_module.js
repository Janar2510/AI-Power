/**
 * Unit tests for AppCore.ListViewModule.
 */
(function () {
  const H = window.TestHelpers;
  const M = window.AppCore && window.AppCore.ListViewModule;

  function run() {
    const results = { pass: 0, fail: 0, errors: [] };

    function test(name, fn) {
      try {
        fn();
        results.pass++;
      } catch (e) {
        results.fail++;
        results.errors.push(name + ': ' + e.message);
      }
    }

    if (!M || typeof M.render !== 'function') {
      results.fail++;
      results.errors.push('AppCore.ListViewModule.render not found');
      return results;
    }

    test('render outputs list shell and records', function () {
      const el = H.createContainer();
      try {
        const handled = M.render(el, {
          model: 'res.partner',
          route: 'contacts',
          records: [{ id: 1, name: 'Alice' }],
          searchTerm: '',
          totalCount: 1,
          offset: 0,
          limit: 80,
          savedFiltersList: [],
          currentListState: {
            route: 'contacts',
            searchTerm: '',
            activeSearchFilters: [],
            groupBy: null,
            savedFilterId: null,
            viewType: 'list',
            order: null,
          },
          helpers: {
            getAvailableViewModes: function () { return ['list']; },
            getListColumns: function () { return ['name']; },
            getTitle: function () { return 'Contacts'; },
            getReportName: function () { return null; },
            getMany2oneComodel: function () { return null; },
            getMany2manyInfo: function () { return null; },
            isMonetaryField: function () { return false; },
            getMonetaryCurrencyField: function () { return null; },
            getSelectionLabel: function (_model, _field, value) { return value; },
            applyActionStackForList: function () {},
            renderViewSwitcher: function () { return ''; },
            getHashDomainParam: function () { return null; },
          },
        });
        H.assertTrue(handled);
        H.assertTrue(el.textContent.includes('Contacts'));
        H.assertTrue(el.textContent.includes('Add contact'));
        H.assertTrue(el.textContent.includes('AI Search'));
        H.assertTrue(el.textContent.includes('Alice'));
      } finally {
        H.removeContainer(el);
      }
    });

    return results;
  }

  window.Tests = window.Tests || {};
  window.Tests.list_view_module = run;
})();
