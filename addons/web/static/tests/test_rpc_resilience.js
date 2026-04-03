/**
 * Post-1.250.11: RPC resilience tests — non-JSON guard, 429 handling, CSRF retry.
 *
 * These tests stub window.fetch to simulate server misbehavior and verify
 * that rpc.js handles it gracefully.
 */
(function () {
  window.Tests = window.Tests || {};

  window.Tests.rpc_resilience = function () {
    var pass = 0;
    var fail = 0;
    var errors = [];
    var rpc = window.Services && window.Services.rpc;
    if (!rpc || typeof rpc.rpc !== "function") {
      return { pass: 0, fail: 1, errors: ["missing Services.rpc"] };
    }

    var origFetch = window.fetch;
    var testQueue = [];

    function mockFetch(responseFn) {
      window.fetch = function () {
        return Promise.resolve(responseFn());
      };
    }

    function restore() {
      window.fetch = origFetch;
    }

    function makeResponse(status, body, contentType) {
      return {
        status: status,
        ok: status >= 200 && status < 300,
        headers: { get: function (h) { return h.toLowerCase() === "content-type" ? (contentType || "text/html") : null; } },
        json: function () { return Promise.resolve(JSON.parse(body)); },
        text: function () { return Promise.resolve(body); },
      };
    }

    function runTests() {
      return testNonJsonGuard()
        .then(testRateLimit429)
        .then(testCsrfRetry)
        .then(function () {
          restore();
          return { pass: pass, fail: fail, errors: errors };
        })
        .catch(function (err) {
          restore();
          fail++;
          errors.push("unexpected: " + (err && err.message ? err.message : String(err)));
          return { pass: pass, fail: fail, errors: errors };
        });
    }

    function testNonJsonGuard() {
      mockFetch(function () {
        return makeResponse(502, "<html><body>Bad Gateway</body></html>", "text/html");
      });
      return rpc.rpc({ model: "res.partner", method: "search_read", args: [], kwargs: {} }).then(
        function () {
          fail++;
          errors.push("non-JSON: should have thrown");
        },
        function (err) {
          if (err && err.message && err.message.indexOf("non-JSON") >= 0 && err.message.indexOf("502") >= 0) {
            pass++;
          } else {
            fail++;
            errors.push("non-JSON: wrong error message: " + (err && err.message));
          }
        }
      );
    }

    function testRateLimit429() {
      mockFetch(function () {
        return makeResponse(429, '{"error":"Too many requests"}', "application/json");
      });
      return rpc.rpc({ model: "res.partner", method: "search_read", args: [], kwargs: {} }).then(
        function () {
          fail++;
          errors.push("429: should have thrown");
        },
        function (err) {
          if (err && err.type === "RateLimitError" && err.status === 429) {
            pass++;
          } else {
            fail++;
            errors.push("429: wrong error type/status: " + JSON.stringify({ type: err && err.type, status: err && err.status, msg: err && err.message }));
          }
        }
      );
    }

    function testCsrfRetry() {
      var callCount = 0;
      var origSession = window.Services && window.Services.session;
      window.Services = window.Services || {};
      window.Services.session = {
        getCsrfToken: function () { return "old-token"; },
        refreshCsrfToken: function () {
          return Promise.resolve("new-token");
        },
      };
      window.fetch = function () {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(makeResponse(403, '{"error":"Invalid CSRF token"}', "application/json"));
        }
        return Promise.resolve(makeResponse(200, '{"jsonrpc":"2.0","result":{"ok":true},"id":1}', "application/json"));
      };
      return rpc.rpc({ model: "res.partner", method: "search_read", args: [], kwargs: {} }).then(
        function (result) {
          if (result && result.ok && callCount === 2) {
            pass++;
          } else {
            fail++;
            errors.push("csrf-retry: expected success after retry, got: " + JSON.stringify(result) + " calls:" + callCount);
          }
          window.Services.session = origSession;
        },
        function (err) {
          fail++;
          errors.push("csrf-retry: should not throw after successful retry: " + (err && err.message));
          window.Services.session = origSession;
        }
      );
    }

    return runTests();
  };
})();
