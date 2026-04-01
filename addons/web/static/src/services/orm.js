/**
 * ORM service — Odoo 19-compatible client-side ORM wrapper.
 * Provides typed CRUD helpers over the generic RPC service.
 *
 * Usage (legacy):  Services.orm.read('res.partner', [1,2], ['name'])
 * Usage (modern):  env.services.orm.read(...)
 *
 * Phase 1.245 Track E1. Phase 806b: create/write/unlink invalidate `__ERP_RELATIONAL_MODEL` read cache.
 */
(function () {
  function _rpc() {
    return window.Services && window.Services.rpc;
  }

  function _userContext() {
    var session = window.Services && window.Services.session;
    if (session && typeof session.getSessionInfo === 'function') {
      var info = session._cachedInfo || null;
      return (info && info.user_context) || {};
    }
    return {};
  }

  function _mergeContext(kwargs) {
    var kw = kwargs || {};
    var ctx = Object.assign({}, _userContext(), kw.context || {});
    return Object.assign({}, kw, { context: ctx });
  }

  function _callKw(model, method, args, kwargs) {
    var rpc = _rpc();
    if (!rpc) return Promise.reject(new Error('RPC service not available'));
    return rpc.callKw(model, method, args || [], _mergeContext(kwargs));
  }

  function _relationalModel() {
    return window.__ERP_RELATIONAL_MODEL;
  }

  /** Phase 806: drop client readRecord cache rows after ORM mutations. */
  function _invalidateReadRecordCache(model, ids) {
    var RM = _relationalModel();
    if (!RM || typeof RM.invalidateReadRecordCache !== 'function' || !model) return;
    if (ids == null) {
      RM.invalidateReadRecordCache(model, null);
      return;
    }
    var list = Array.isArray(ids) ? ids : [ids];
    list.forEach(function (id) {
      RM.invalidateReadRecordCache(model, id);
    });
  }

  var orm = {
    /**
     * Generic model method call (mirrors Odoo call_kw).
     * @param {string} model   — e.g. 'res.partner'
     * @param {string} method  — e.g. 'action_confirm'
     * @param {Array}  [args]
     * @param {Object} [kwargs]
     * @returns {Promise}
     */
    call: function (model, method, args, kwargs) {
      return _callKw(model, method, args, kwargs);
    },

    /**
     * @param {string} model
     * @param {Array<number>} ids
     * @param {Array<string>} [fields]
     * @param {Object} [kwargs]
     */
    read: function (model, ids, fields, kwargs) {
      if (!ids || !ids.length) return Promise.resolve([]);
      return _callKw(model, 'read', [ids, fields || []], kwargs);
    },

    /**
     * @param {string} model
     * @param {Array}  domain
     * @param {Array<string>} [fields]
     * @param {Object} [kwargs] — may include limit, offset, order
     */
    searchRead: function (model, domain, fields, kwargs) {
      var kw = Object.assign({}, kwargs || {}, {
        domain: domain || [],
        fields: fields || [],
      });
      return _callKw(model, 'search_read', [], kw);
    },

    /**
     * @param {string} model
     * @param {Array}  domain
     * @param {Object} [kwargs]
     * @returns {Promise<number>}
     */
    searchCount: function (model, domain, kwargs) {
      return _callKw(model, 'search_count', [domain || []], kwargs);
    },

    /**
     * @param {string} model
     * @param {Object|Array<Object>} vals — single record or array
     * @param {Object} [kwargs]
     * @returns {Promise<number|Array<number>>}
     */
    create: function (model, vals, kwargs) {
      var records = Array.isArray(vals) ? vals : [vals];
      return _callKw(model, 'create', [records], kwargs).then(function (res) {
        _invalidateReadRecordCache(model, null);
        return res;
      });
    },

    /**
     * @param {string} model
     * @param {number|Array<number>} ids
     * @param {Object} data
     * @param {Object} [kwargs]
     */
    write: function (model, ids, data, kwargs) {
      var idList = Array.isArray(ids) ? ids : [ids];
      return _callKw(model, 'write', [idList, data || {}], kwargs).then(function (res) {
        _invalidateReadRecordCache(model, idList);
        return res;
      });
    },

    /**
     * @param {string} model
     * @param {number|Array<number>} ids
     * @param {Object} [kwargs]
     */
    unlink: function (model, ids, kwargs) {
      var idList = Array.isArray(ids) ? ids : [ids];
      if (!idList.length) return Promise.resolve(true);
      return _callKw(model, 'unlink', [idList], kwargs).then(function (res) {
        _invalidateReadRecordCache(model, idList);
        return res;
      });
    },

    /**
     * @param {string} model
     * @param {Array<number>} ids
     * @param {Object} [kwargs]
     */
    nameGet: function (model, ids, kwargs) {
      if (!ids || !ids.length) return Promise.resolve([]);
      return _callKw(model, 'name_get', [ids], kwargs);
    },

    /**
     * @param {string} model
     * @param {string} name
     * @param {Array}  [domain]
     * @param {Object} [kwargs]
     */
    nameSearch: function (model, name, domain, kwargs) {
      var kw = Object.assign({}, kwargs || {}, {
        name: name || '',
        args: domain || [],
      });
      return _callKw(model, 'name_search', [], kw);
    },
  };

  window.Services = window.Services || {};
  window.Services.orm = orm;
})();
