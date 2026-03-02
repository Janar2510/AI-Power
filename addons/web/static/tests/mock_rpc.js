/**
 * Mock RPC server - deterministic responses for JS unit tests.
 * Overrides fetch before any service loads. Use MockRpc.setResponse() to configure.
 */
(function () {
  const responses = new Map();

  function mockFetch(url, options) {
    const key = url + (options && options.body ? '|' + options.body : '');
    for (const [pattern, handler] of responses) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        const result = typeof handler === 'function' ? handler(url, options) : handler;
        return Promise.resolve(new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      if (pattern instanceof RegExp && pattern.test(key)) {
        const result = typeof handler === 'function' ? handler(url, options) : handler;
        return Promise.resolve(new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    }
    return Promise.reject(new Error('MockRpc: no response for ' + url));
  }

  window.MockRpc = {
    setResponse(urlPattern, response) {
      responses.set(urlPattern, response);
    },
    setRpcResponse(model, method, result) {
      this.setResponse('/web/dataset/call_kw', (url, options) => {
        let body;
        try {
          body = options && options.body ? JSON.parse(options.body) : {};
        } catch (_) { return { error: { message: 'Invalid body' } }; }
        const params = body.params || {};
        if (params.model === model && params.method === method) {
          return { result: typeof result === 'function' ? result(params) : result };
        }
        return { error: { message: 'No mock for ' + model + '.' + method } };
      });
    },
    setLoadViewsResponse(data) {
      this.setResponse('/web/load_views', data);
    },
    clear() {
      responses.clear();
    },
    install() {
      window._realFetch = window.fetch;
      window.fetch = mockFetch;
    },
    uninstall() {
      if (window._realFetch) {
        window.fetch = window._realFetch;
        delete window._realFetch;
      }
    }
  };

  MockRpc.install();
})();
