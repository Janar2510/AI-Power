/**
 * DOM helpers for JS unit tests - create containers, assert visibility, etc.
 */
(function () {
  window.TestHelpers = {
    createContainer() {
      const el = document.createElement('div');
      el.id = 'test-container-' + Date.now();
      document.body.appendChild(el);
      return el;
    },
    removeContainer(el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    },
    assertEqual(actual, expected, msg) {
      if (actual !== expected) {
        throw new Error((msg || 'Assertion failed') + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
      }
    },
    assertDeepEqual(actual, expected, msg) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error((msg || 'Assertion failed') + ': expected ' + b + ', got ' + a);
      }
    },
    assertTrue(val, msg) {
      if (!val) throw new Error((msg || 'Expected true') + ', got ' + val);
    },
    assertFalse(val, msg) {
      if (val) throw new Error((msg || 'Expected false') + ', got ' + val);
    },
    assertThrows(fn, msg) {
      try {
        fn();
        throw new Error(msg || 'Expected function to throw');
      } catch (e) {
        if (e.message === (msg || 'Expected function to throw')) throw e;
        return e;
      }
    }
  };
})();
