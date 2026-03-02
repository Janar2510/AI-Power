/**
 * Test runner - runs all registered tests and reports results.
 * Supports sync and async test suites.
 */
(function () {
  function collectResult(total, name, result) {
    total.pass += result.pass || 0;
    total.fail += result.fail || 0;
    if (result.errors && result.errors.length) {
      result.errors.forEach(function (e) {
        total.errors.push('[' + name + '] ' + e);
      });
    }
  }

  function runAll() {
    const suites = window.Tests || {};
    const total = { pass: 0, fail: 0, errors: [] };
    const promises = [];

    for (const name in suites) {
      const fn = suites[name];
      if (typeof fn !== 'function') continue;
      const p = Promise.resolve(fn()).then(function (result) {
        collectResult(total, name, result || {});
      }).catch(function (e) {
        total.fail++;
        total.errors.push('[' + name + '] ' + (e.message || e));
      });
      promises.push(p);
    }

    return Promise.all(promises).then(function () { return total; });
  }

  function renderResults(result) {
    const el = document.getElementById('test-results');
    if (!el) return;

    el.innerHTML = '';
    const div = document.createElement('div');
    div.style.cssText = 'font-family:monospace;padding:1rem;';
    div.innerHTML = '<h3>JS Unit Tests</h3>' +
      '<p>Pass: <strong style="color:green">' + result.pass + '</strong></p>' +
      '<p>Fail: <strong style="color:' + (result.fail ? 'red' : 'green') + '">' + result.fail + '</strong></p>';
    if (result.errors.length) {
      const ul = document.createElement('ul');
      ul.style.color = 'red';
      result.errors.forEach(function (e) {
        const li = document.createElement('li');
        li.textContent = e;
        ul.appendChild(li);
      });
      div.appendChild(ul);
    }
    el.appendChild(div);

    window.__jsTestResult = result;
  }

  document.addEventListener('DOMContentLoaded', function () {
    runAll().then(renderResults);
  });
})();
