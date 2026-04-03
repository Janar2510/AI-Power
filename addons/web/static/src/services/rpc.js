/**
 * RPC service - Odoo 19.0 compatible call_kw
 */
(function () {
  const rpc = {
    url: '/web/dataset/call_kw',
    _post(params, headers) {
      return fetch(this.url, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: params,
          id: Math.floor(Math.random() * 1e9)
        })
      });
    },
    rpc(params) {
      const headers = { 'Content-Type': 'application/json' };
      const csrf = window.Services && window.Services.session && window.Services.session.getCsrfToken && window.Services.session.getCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;
      return this._post(params, headers).then(r => {
        if (r.status === 403 && window.Services && window.Services.session && window.Services.session.refreshCsrfToken) {
          return window.Services.session.refreshCsrfToken().then(function (newToken) {
            if (newToken) {
              const retryHeaders = { 'Content-Type': 'application/json', 'X-CSRF-Token': newToken };
              return rpc._post(params, retryHeaders);
            }
            return r;
          });
        }
        return r;
      }).then(r => {
        if (r.status === 401) throw new Error('Session expired. Please log in again.');
        if (r.status === 403) throw new Error('CSRF/session invalid. Please refresh login session.');
        if (r.status === 429) {
          return r.text().then(function (body) {
            var msg = 'Too many requests';
            try { var parsed = JSON.parse(body); msg = parsed.error || parsed.message || msg; } catch (_e) {}
            var err = new Error(msg);
            err.type = 'RateLimitError';
            err.status = 429;
            throw err;
          });
        }
        return r.text().then(function (body) {
          try {
            return JSON.parse(body);
          } catch (_e) {
            throw new Error('Server returned non-JSON response (status: ' + r.status + ')');
          }
        });
      }).then(data => {
        if (data.error) throw new Error(data.error.message || 'RPC error');
        return data.result != null ? data.result : data;
      });
    },
    callKw(model, method, args, kwargs) {
      return this.rpc({ model, method, args: args || [], kwargs: kwargs || {} });
    }
  };
  window.Services = window.Services || {};
  window.Services.rpc = rpc;
})();
