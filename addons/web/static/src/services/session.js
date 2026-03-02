/**
 * Session service - session info (uid, db)
 */
(function () {
  let _cached = null;
  const session = {
    getSessionInfo() {
      if (_cached) return Promise.resolve(_cached);
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
    clearCache() { _cached = null; }
  };
  window.Services = window.Services || {};
  window.Services.session = session;
})();
