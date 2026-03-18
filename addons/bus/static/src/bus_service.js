/**
 * Bus service - WebSocket first, fallback to longpolling (Phases 92, 95)
 */
(function () {
  let _lastId = 0;
  let _channels = [];
  let _pollTimer = null;
  let _pollInterval = 30000;
  let _useWebSocket = true;
  let _wsReconnectDelay = 1000;
  let _ws = null;

  function dispatchMessages(data) {
    if (data.messages && data.messages.length) {
      _lastId = data.last || _lastId;
      data.messages.forEach(function (msg) {
        try {
          const payload = typeof msg.message === 'string' ? JSON.parse(msg.message || '{}') : (msg.message || {});
          window.dispatchEvent(new CustomEvent('bus:message', { detail: { channel: msg.channel, message: payload, id: msg.id } }));
        } catch (e) {}
      });
    }
  }

  function poll() {
    if (!_channels.length) return;
    var pollHdrs = { 'Content-Type': 'application/json' };
    if (window.Services && window.Services.session && window.Services.session.getAuthHeaders) Object.assign(pollHdrs, window.Services.session.getAuthHeaders());
    fetch('/longpolling/poll', {
      method: 'POST',
      headers: pollHdrs,
      credentials: 'include',
      body: JSON.stringify({ channels: _channels, last: _lastId })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || 'Poll failed'); });
      return r.json();
    }).then(function (data) {
      dispatchMessages(data);
    }).catch(function () {}).finally(function () {
      _pollTimer = setTimeout(poll, _pollInterval);
    });
  }

  function tryWebSocket() {
    if (!_channels.length || !_useWebSocket) {
      poll();
      return;
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = proto + '//' + window.location.host + '/websocket/';
    try {
      const ws = new WebSocket(url);
      _ws = ws;
      ws.onopen = function () {
        ws.send(JSON.stringify({ channels: _channels, last: _lastId }));
        _wsReconnectDelay = 1000;
      };
      ws.onmessage = function (ev) {
        try {
          const data = JSON.parse(ev.data || '{}');
          dispatchMessages(data);
          if (data.last) _lastId = data.last;
        } catch (e) {}
      };
      ws.onerror = function () {
        _useWebSocket = false;
        if (_pollTimer) clearTimeout(_pollTimer);
        poll();
      };
      ws.onclose = function () {
        _ws = null;
        _pollTimer = setTimeout(function () {
          _useWebSocket = true;
          tryWebSocket();
        }, _wsReconnectDelay);
        _wsReconnectDelay = Math.min(_wsReconnectDelay * 2, 30000);
      };
    } catch (e) {
      _useWebSocket = false;
      poll();
    }
  }

  const busService = {
    start: function (channels) {
      _channels = channels || [];
      if (_pollTimer) clearTimeout(_pollTimer);
      if (_ws) _ws.close();
      tryWebSocket();
    },
    stop: function () {
      if (_pollTimer) {
        clearTimeout(_pollTimer);
        _pollTimer = null;
      }
      if (_ws) {
        _ws.close();
        _ws = null;
      }
      _channels = [];
    },
    setChannels: function (channels) {
      _channels = channels || [];
    }
  };

  window.Services = window.Services || {};
  window.Services.bus = busService;
})();
