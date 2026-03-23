(function () {
  window.AppCore = window.AppCore || {};

  function safeHash(hash) {
    const h = String(hash || "").replace(/^#/, "").trim();
    return h || "home";
  }

  const _state = {
    dirty: false,
    lastHash: "home",
  };
  const _handlers = {
    renderNavbar: null,
    applyRoute: null,
    isFormRoute: null,
    confirmLeave: null,
  };

  const Router = {
    breadcrumbs: [],
    setState(next) {
      if (!next || typeof next !== "object") return;
      if (Object.prototype.hasOwnProperty.call(next, "dirty")) _state.dirty = !!next.dirty;
      if (Object.prototype.hasOwnProperty.call(next, "lastHash")) _state.lastHash = safeHash(next.lastHash);
    },
    getState() {
      return { dirty: _state.dirty, lastHash: _state.lastHash };
    },
    setHandlers(handlers) {
      handlers = handlers || {};
      _handlers.renderNavbar = typeof handlers.renderNavbar === "function" ? handlers.renderNavbar : _handlers.renderNavbar;
      _handlers.applyRoute = typeof handlers.applyRoute === "function" ? handlers.applyRoute : _handlers.applyRoute;
      _handlers.isFormRoute = typeof handlers.isFormRoute === "function" ? handlers.isFormRoute : _handlers.isFormRoute;
      _handlers.confirmLeave = typeof handlers.confirmLeave === "function" ? handlers.confirmLeave : _handlers.confirmLeave;
    },
    pushBreadcrumb(label, hash) {
      this.breadcrumbs.push({ label: label || "", hash: safeHash(hash) });
    },
    popBreadcrumbTo(index) {
      if (index < 0 || index >= this.breadcrumbs.length) {
        return null;
      }
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      return this.breadcrumbs[this.breadcrumbs.length - 1] || null;
    },
    renderBreadcrumbs() {
      if (this.breadcrumbs.length <= 1) {
        return "";
      }
      let html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
      this.breadcrumbs.forEach(function (entry, idx, all) {
        if (idx === all.length - 1) {
          html += '<span class="breadcrumb-item active">' + String(entry.label || "").replace(/</g, "&lt;") + "</span>";
        } else {
          html += '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' + idx + '">' + String(entry.label || "").replace(/</g, "&lt;") + "</a>";
          html += '<span class="breadcrumb-sep">/</span>';
        }
      });
      html += "</nav>";
      return html;
    },
    getAction(route, menuList, actionResolver) {
      const r = safeHash(route);
      const menus = Array.isArray(menuList) ? menuList : [];
      for (let i = 0; i < menus.length; i += 1) {
        const menu = menus[i];
        const action = menu && menu.action ? actionResolver(menu.action) : null;
        if (action && action._route_slug === r) {
          return action;
        }
      }
      return null;
    },
    navigate(hash) {
      const route = safeHash(hash);
      window.location.hash = "#" + route;
      return route;
    },
    routeApply(hash, base) {
      if (typeof _handlers.applyRoute === "function") {
        _handlers.applyRoute(hash, base);
      }
    },
    route() {
      const hash = (window.location.hash || "#home").slice(1);
      const base = hash.split("?")[0];
      if (typeof _handlers.renderNavbar === "function") {
        _handlers.renderNavbar();
      }
      const isForm = typeof _handlers.isFormRoute === "function" ? _handlers.isFormRoute : function () { return false; };
      if (_state.dirty && isForm(_state.lastHash) && hash !== _state.lastHash && typeof _handlers.confirmLeave === "function") {
        _handlers.confirmLeave().then(function (ok) {
          if (!ok) {
            window.location.hash = _state.lastHash;
            return;
          }
          _state.dirty = false;
          _state.lastHash = hash;
          Router.routeApply(hash, base);
        });
        return;
      }
      _state.lastHash = hash;
      Router.routeApply(hash, base);
    },
  };

  window.AppCore.Router = Router;
})();
