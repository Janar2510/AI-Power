/**
 * Session service - session info (uid, db, csrf_token)
 */
(function () {
  let _cached = null;
  const session = {
    getSessionInfo(force) {
      if (!force && _cached) return Promise.resolve(_cached);
      return fetch('/web/session/get_session_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}'
      }).then(r => {
        if (r.status === 401) return null;
        return r.json();
      }).then(data => {
        _cached = data;
        return data;
      });
    },
    refreshCsrfToken() {
      return this.getSessionInfo(true).then(info => (info && info.csrf_token) ? info.csrf_token : null);
    },
    getCsrfToken() {
      return _cached && _cached.csrf_token ? _cached.csrf_token : null;
    },
    getAuthHeaders() {
      const token = this.getCsrfToken();
      return token ? { 'X-CSRF-Token': token } : {};
    },
    clearCache() { _cached = null; }
  };
  window.Services = window.Services || {};
  window.Services.session = session;
})();
