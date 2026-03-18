/**
 * RPC service - Odoo 19.0 compatible call_kw
 */
(function () {
  const rpc = {
    url: '/web/dataset/call_kw',
    rpc(params) {
      const headers = { 'Content-Type': 'application/json' };
      const csrf = window.Services && window.Services.session && window.Services.session.getCsrfToken && window.Services.session.getCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;
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
      }).then(r => {
        if (r.status === 401) throw new Error('Session expired. Please log in again.');
        return r.json();
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
