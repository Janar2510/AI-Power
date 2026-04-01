/**
 * Legacy chrome block: delegates import, reports, navbar (Phase 804 + 806).
 * Loaded before main.js; wired via install(ctx) from main IIFE.
 */
(function () {
  var _ctx = {};

  function install(ctx) {
    _ctx = ctx || {};
    if (window.__ERP_LEGACY_MAIN_IMPORT && typeof window.__ERP_LEGACY_MAIN_IMPORT.install === "function") {
      window.__ERP_LEGACY_MAIN_IMPORT.install(ctx);
    }
    if (window.__ERP_LEGACY_MAIN_REPORTS && typeof window.__ERP_LEGACY_MAIN_REPORTS.install === "function") {
      window.__ERP_LEGACY_MAIN_REPORTS.install(ctx);
    }
    if (window.__ERP_LEGACY_MAIN_NAVBAR && typeof window.__ERP_LEGACY_MAIN_NAVBAR.install === "function") {
      window.__ERP_LEGACY_MAIN_NAVBAR.install(ctx);
    }
  }

  window.__ERP_CHROME_BLOCK = {
    install: install,
    showImportModal: function (model, route) {
      if (window.__ERP_LEGACY_MAIN_IMPORT && window.__ERP_LEGACY_MAIN_IMPORT.showImportModal) {
        return window.__ERP_LEGACY_MAIN_IMPORT.showImportModal(model, route);
      }
    },
    renderNavbar: function (userCompanies, userLangs, currentLang) {
      if (window.__ERP_LEGACY_MAIN_NAVBAR && window.__ERP_LEGACY_MAIN_NAVBAR.renderNavbar) {
        return window.__ERP_LEGACY_MAIN_NAVBAR.renderNavbar(userCompanies, userLangs, currentLang);
      }
    },
    renderAccountingReport: function (reportType, title) {
      if (window.__ERP_LEGACY_MAIN_REPORTS && window.__ERP_LEGACY_MAIN_REPORTS.renderAccountingReport) {
        return window.__ERP_LEGACY_MAIN_REPORTS.renderAccountingReport(reportType, title);
      }
    },
    renderStockValuationReport: function () {
      if (window.__ERP_LEGACY_MAIN_REPORTS && window.__ERP_LEGACY_MAIN_REPORTS.renderStockValuationReport) {
        return window.__ERP_LEGACY_MAIN_REPORTS.renderStockValuationReport();
      }
    },
    renderSalesRevenueReport: function () {
      if (window.__ERP_LEGACY_MAIN_REPORTS && window.__ERP_LEGACY_MAIN_REPORTS.renderSalesRevenueReport) {
        return window.__ERP_LEGACY_MAIN_REPORTS.renderSalesRevenueReport();
      }
    },
  };
})();
