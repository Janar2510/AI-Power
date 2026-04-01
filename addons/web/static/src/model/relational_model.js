/**
 * Client-side relational model facade (Phase 1.246 G1).
 * Minimal DataPoint / Record / DynamicList over Services.orm — clean-room, not Odoo copy.
 * Phase 804: optional readRecord cache. Phase 806b: Services.orm create/write/unlink call invalidateReadRecordCache (see services/orm.js).
 */
(function () {
  var _readRecordCache = Object.create(null);

  function _readCacheKey(resModel, id, fields) {
    var fk = (fields || []).slice().sort().join("\0");
    return resModel + "\0" + id + "\0" + fk;
  }

  function _orm() {
    return window.Services && window.Services.orm;
  }

  function DataPoint(config) {
    config = config || {};
    this.resModel = config.resModel || "";
    this.id = config.id != null ? config.id : null;
    this.values = config.values || {};
  }

  function Record(model, id, values) {
    DataPoint.call(this, { resModel: model, id: id, values: values || {} });
  }
  Record.prototype = Object.create(DataPoint.prototype);
  Record.prototype.constructor = Record;

  function DynamicList(model, config) {
    config = config || {};
    this.resModel = model;
    this.ids = (config.ids || []).slice();
    this.records = [];
    this._domain = config.domain || [];
    this._fields = config.fields || ["id"];
    this._limit = config.limit != null ? config.limit : 80;
    this._offset = config.offset != null ? config.offset : 0;
    this._order = config.order || null;
  }

  DynamicList.prototype.load = function () {
    var orm = _orm();
    if (!orm) return Promise.reject(new Error("ORM unavailable"));
    var self = this;
    var kw = { limit: this._limit, offset: this._offset };
    if (this._order) kw.order = this._order;
    return orm.searchRead(this.resModel, this._domain, this._fields, kw).then(function (rows) {
      self.records = rows || [];
      self.ids = self.records.map(function (r) {
        return r.id;
      });
      return self;
    });
  };

  var RelationalModel = {
    DataPoint: DataPoint,
    Record: Record,
    DynamicList: DynamicList,
    /**
     * @param {string} resModel
     * @param {{ domain?: any[], fields?: string[], limit?: number, offset?: number, order?: string }} [opts]
     */
    loadList: function (resModel, opts) {
      var list = new DynamicList(resModel, opts || {});
      return list.load();
    },
    /**
     * @param {string} resModel
     * @param {number|number[]} ids
     * @param {string[]} [fields]
     */
    readRecord: function (resModel, ids, fields) {
      var orm = _orm();
      if (!orm) return Promise.reject(new Error("ORM unavailable"));
      var idList = Array.isArray(ids) ? ids : [ids];
      var fieldList = fields || [];
      if (idList.length === 1) {
        var ck = _readCacheKey(resModel, idList[0], fieldList);
        var hit = _readRecordCache[ck];
        if (hit) {
          return Promise.resolve(new Record(resModel, hit.id, Object.assign({}, hit.values)));
        }
      }
      return orm.read(resModel, idList, fieldList).then(function (rows) {
        var r = rows && rows[0];
        var rec = r ? new Record(resModel, r.id, r) : null;
        if (rec && idList.length === 1) {
          _readRecordCache[_readCacheKey(resModel, rec.id, fieldList)] = {
            id: rec.id,
            values: Object.assign({}, rec.values),
          };
        }
        return rec;
      });
    },
    clearReadRecordCache: function () {
      _readRecordCache = Object.create(null);
    },
    /**
     * Drop cached reads for one record (all field sets) or all ids in a model when id omitted.
     */
    invalidateReadRecordCache: function (resModel, id) {
      var prefix = String(resModel || "") + "\0";
      if (id == null) {
        Object.keys(_readRecordCache).forEach(function (k) {
          if (k.indexOf(prefix) === 0) delete _readRecordCache[k];
        });
        return;
      }
      var p2 = prefix + id + "\0";
      Object.keys(_readRecordCache).forEach(function (k) {
        if (k.indexOf(p2) === 0) delete _readRecordCache[k];
      });
    },
    /**
     * Optional onchange bridge (server method if present).
     */
    onchange: function (model, ids, vals, fieldNames) {
      var rpc = window.Services && window.Services.rpc;
      if (!rpc) return Promise.reject(new Error("RPC unavailable"));
      return rpc.callKw(model, "onchange", [ids, vals || {}, fieldNames || []], {});
    },
  };

  window.__ERP_RELATIONAL_MODEL = RelationalModel;
})();
