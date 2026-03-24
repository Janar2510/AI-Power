function createCategory() {
  const entries = new Map();
  const listeners = new Set();

  function notify(detail) {
    listeners.forEach(function (listener) {
      listener(detail);
    });
  }

  function orderedEntries() {
    return Array.from(entries.entries()).sort(function (left, right) {
      const leftSeq = left[1].sequence || 100;
      const rightSeq = right[1].sequence || 100;
      if (leftSeq !== rightSeq) {
        return leftSeq - rightSeq;
      }
      return String(left[0]).localeCompare(String(right[0]));
    });
  }

  return {
    add(key, value, options) {
      const entry = {
        key: key,
        value: value,
        sequence: options && options.sequence != null ? Number(options.sequence) : 100,
        options: options || {},
      };
      entries.set(key, entry);
      notify({ operation: "add", key: key, value: value, options: entry.options });
      return value;
    },
    delete(key) {
      const existing = entries.get(key);
      const deleted = entries.delete(key);
      if (deleted) {
        notify({ operation: "delete", key: key, value: existing && existing.value, options: existing && existing.options });
      }
      return deleted;
    },
    get(key) {
      const entry = entries.get(key);
      return entry ? entry.value : undefined;
    },
    getAll() {
      return orderedEntries().map(function (item) {
        return item[1].value;
      });
    },
    getEntries() {
      return orderedEntries().map(function (item) {
        return [item[0], item[1].value];
      });
    },
    getDetailedEntries() {
      return orderedEntries().map(function (item) {
        return {
          key: item[0],
          value: item[1].value,
          sequence: item[1].sequence,
          options: item[1].options,
        };
      });
    },
    has(key) {
      return entries.has(key);
    },
    subscribe(listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    },
  };
}

export function createRegistry() {
  const categories = new Map();

  function ensureCategory(name) {
    if (!categories.has(name)) {
      categories.set(name, createCategory());
    }
    return categories.get(name);
  }

  return {
    category(name) {
      return ensureCategory(name);
    },
    snapshot() {
      const result = {};
      categories.forEach(function (category, key) {
        result[key] = category.getEntries();
      });
      return result;
    },
  };
}
