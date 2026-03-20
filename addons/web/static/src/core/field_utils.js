(function () {
  window.AppCore = window.AppCore || {};

  const FieldUtils = {
    getMeta(fields, name) {
      const defs = fields || {};
      return defs[name] || {};
    },
    isBoolean(fieldMeta) {
      const t = fieldMeta && (fieldMeta.type || fieldMeta.ttype);
      return t === "boolean";
    },
    getSelectionOptions(fieldMeta) {
      return Array.isArray(fieldMeta && fieldMeta.selection) ? fieldMeta.selection : [];
    },
    parseActionDomain(source) {
      if (!source || typeof source !== "string") {
        return [];
      }
      try {
        return JSON.parse(source.replace(/'/g, '"'));
      } catch (_error) {
        return [];
      }
    },
    parseFilterDomain(source, uid) {
      if (!source || typeof source !== "string") {
        return [];
      }
      let s = source;
      if (uid != null) {
        s = s.replace(/\buid\b/g, String(uid));
      }
      try {
        const json = s.replace(/\(/g, "[").replace(/\)/g, "]").replace(/'/g, '"');
        return JSON.parse(json);
      } catch (_error) {
        return [];
      }
    },
  };

  window.AppCore.FieldUtils = FieldUtils;
})();
