/**
 * Legacy main: accounting / stock / sales report shells (split from chrome block, Phase 804).
 */
(function () {
  var _ctx = {};

  function install(ctx) {
    _ctx = ctx || {};
  }

function renderAccountingReport(reportType, title) {
  if (_ctx.GraphViewCore && typeof _ctx.GraphViewCore.renderAccountingReport === "function") {
    var graphHandled = _ctx.GraphViewCore.renderAccountingReport(_ctx.main, { reportType: reportType, title: title, rpc: _ctx.rpc });
    if (graphHandled) return;
  }
  _ctx.setActionStack([{ label: title, hash: 'reports/' + reportType }]);
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = today.slice(0, 4) + '-01-01';
  _ctx.main.innerHTML = '<h2>' + title + '</h2><p style="margin-bottom:1rem">' +
    '<label>From <input type="date" id="report-date-from" value="' + yearStart + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
    '<label>To <input type="date" id="report-date-to" value="' + today + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
    '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem">Refresh</button>' +
    '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;margin-left:0.25rem">Print</button>' +
    '</p><div id="report-table" style="overflow-x:auto">' + _ctx.skeletonHtml(8, true) + '</div>';
  function loadReport() {
    const df = document.getElementById('report-date-from').value || yearStart;
    const dt = document.getElementById('report-date-to').value || today;
    const method = reportType === 'trial-balance' ? 'get_trial_balance' : (reportType === 'profit-loss' ? 'get_profit_loss' : 'get_balance_sheet');
    const args = reportType === 'balance-sheet' ? [dt] : [df, dt];
    _ctx.rpc.callKw('account.account', method, args, {})
      .then(function (rows) {
        const el = document.getElementById('report-table');
        if (!el) return;
        if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
        const cols = Object.keys(rows[0]);
        let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
        cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/</g, '&lt;') + '</th>'; });
        tbl += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          tbl += '<tr>';
          cols.forEach(function (c) {
            const v = r[c];
            const val = (typeof v === 'number' && (c === 'debit' || c === 'credit' || c === 'balance')) ? v.toFixed(2) : (v || '');
            tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
          });
          tbl += '</tr>';
        });
        tbl += '</tbody></table>';
        el.innerHTML = tbl;
      })
      .catch(function (err) {
        const el = document.getElementById('report-table');
        if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
      });
  }
  document.getElementById('report-refresh').onclick = loadReport;
  document.getElementById('report-print').onclick = function () { window.print(); };
  loadReport();
}

function renderStockValuationReport() {
  if (_ctx.GraphViewCore && typeof _ctx.GraphViewCore.renderStockValuationReport === "function") {
    var stockHandled = _ctx.GraphViewCore.renderStockValuationReport(_ctx.main, { rpc: _ctx.rpc });
    if (stockHandled) return;
  }
  _ctx.setActionStack([{ label: 'Stock Valuation', hash: 'reports/stock-valuation' }]);
  _ctx.main.innerHTML = '<h2>Stock Valuation</h2><p style="margin-bottom:1rem">' +
    '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer">Refresh</button>' +
    '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;margin-left:0.25rem">Print</button>' +
    '</p><div id="report-table" style="overflow-x:auto">' + _ctx.skeletonHtml(8, true) + '</div>';
  function loadReport() {
    _ctx.rpc.callKw('product.product', 'get_stock_valuation_report', [], {})
      .then(function (rows) {
        const el = document.getElementById('report-table');
        if (!el) return;
        if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
        const cols = ['product', 'category', 'qty_available', 'standard_price', 'total_value'];
        let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
        cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/_/g, ' ').replace(/</g, '&lt;') + '</th>'; });
        tbl += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          tbl += '<tr>';
          cols.forEach(function (c) {
            const v = r[c];
            const val = (typeof v === 'number' && (c === 'standard_price' || c === 'total_value')) ? v.toFixed(2) : (v || '');
            tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
          });
          tbl += '</tr>';
        });
        tbl += '</tbody></table>';
        el.innerHTML = tbl;
      })
      .catch(function (err) {
        const el = document.getElementById('report-table');
        if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
      });
  }
  document.getElementById('report-refresh').onclick = loadReport;
  document.getElementById('report-print').onclick = function () { window.print(); };
  loadReport();
}

function renderSalesRevenueReport() {
  if (_ctx.GraphViewCore && typeof _ctx.GraphViewCore.renderSalesRevenueReport === "function") {
    var salesHandled = _ctx.GraphViewCore.renderSalesRevenueReport(_ctx.main, { rpc: _ctx.rpc });
    if (salesHandled) return;
  }
  _ctx.setActionStack([{ label: 'Sales Revenue', hash: 'reports/sales-revenue' }]);
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = today.slice(0, 4) + '-01-01';
  _ctx.main.innerHTML = '<h2>Sales Revenue</h2><p style="margin-bottom:1rem">' +
    '<label>From <input type="date" id="report-date-from" value="' + yearStart + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
    '<label>To <input type="date" id="report-date-to" value="' + today + '" style="padding:0.35rem;margin:0 0.5rem"></label>' +
    '<label>Group by <select id="report-group-by" style="padding:0.35rem;margin:0 0.5rem"><option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="product">Product</option></select></label>' +
    '<button type="button" id="report-refresh" style="padding:0.5rem 1rem;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem">Refresh</button>' +
    '<button type="button" id="report-print" style="padding:0.5rem 1rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;margin-left:0.25rem">Print</button>' +
    '</p><div id="report-table" style="overflow-x:auto">' + _ctx.skeletonHtml(8, true) + '</div>';
  function loadReport() {
    const df = document.getElementById('report-date-from').value || yearStart;
    const dt = document.getElementById('report-date-to').value || today;
    const groupBy = (document.getElementById('report-group-by') && document.getElementById('report-group-by').value) || 'month';
    _ctx.rpc.callKw('sale.order', 'get_sales_revenue_report', [df, dt], { group_by: groupBy })
      .then(function (rows) {
        const el = document.getElementById('report-table');
        if (!el) return;
        if (!rows || !rows.length) { el.innerHTML = '<p style="color:var(--text-muted)">No data</p>'; return; }
        const cols = Object.keys(rows[0]);
        let tbl = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
        cols.forEach(function (c) { tbl += '<th style="padding:0.5rem;border:1px solid var(--border-color);text-align:left">' + String(c).replace(/_/g, ' ').replace(/</g, '&lt;') + '</th>'; });
        tbl += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          tbl += '<tr>';
          cols.forEach(function (c) {
            const v = r[c];
            const val = (typeof v === 'number' && c === 'revenue') ? v.toFixed(2) : (v || '');
            tbl += '<td style="padding:0.5rem;border:1px solid var(--border-color)">' + String(val).replace(/</g, '&lt;') + '</td>';
          });
          tbl += '</tr>';
        });
        tbl += '</tbody></table>';
        el.innerHTML = tbl;
      })
      .catch(function (err) {
        const el = document.getElementById('report-table');
        if (el) el.innerHTML = '<p style="color:#c00">' + (err.message || 'Failed to load').replace(/</g, '&lt;') + '</p>';
      });
  }
  document.getElementById('report-refresh').onclick = loadReport;
  document.getElementById('report-print').onclick = function () { window.print(); };
  loadReport();
}

  window.__ERP_LEGACY_MAIN_REPORTS = {
    install: install,
    renderAccountingReport: renderAccountingReport,
    renderStockValuationReport: renderStockValuationReport,
    renderSalesRevenueReport: renderSalesRevenueReport,
  };
})();
