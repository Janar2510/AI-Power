/**
 * Legacy: menu walk + model fallback for hash slugs. Requires __ERP_ROUTE_LEGACY + Services.views.
 */
(function () {
  var R = window.__ERP_ROUTE_LEGACY;
  if (!R || !R.actionToRoute) return;

  R.getActionForRoute = function (route) {
    var viewsSvc = window.Services && window.Services.views;
    if (!viewsSvc) return null;
    var menus = viewsSvc.getMenus() || [];
    var stack = [].concat(menus);
    while (stack.length) {
      var menu = stack.shift();
      if (!menu) continue;
      var action = menu.action ? viewsSvc.getAction(menu.action) : null;
      if (action && R.actionToRoute(action) === route) return action;
      var children = menu.children || menu.child_id || [];
      if (Array.isArray(children) && children.length) {
        for (var i = 0; i < children.length; i++) stack.push(children[i]);
      }
    }
    return null;
  };

  R.getModelForRoute = function (route) {
    var action = R.getActionForRoute(route);
    if (action) return action.res_model || action.resModel;
    if (route === 'contacts') return 'res.partner';
    if (route === 'pipeline') return 'crm.lead';
    if (route === 'crm/activities') return 'crm.lead';
    if (route === 'leads') return 'crm.lead';
    if (route === 'tasks') return 'project.task';
    if (route === 'articles') return 'knowledge.article';
    if (route === 'knowledge_categories') return 'knowledge.category';
    if (route === 'orders') return 'sale.order';
    if (route === 'subscriptions') return 'sale.subscription';
    if (route === 'products') return 'product.product';
    if (route === 'attachments') return 'ir.attachment';
    if (route === 'settings/users') return 'res.users';
    if (route === 'settings/approval_rules') return 'approval.rule';
    if (route === 'settings/approval_requests') return 'approval.request';
    if (route === 'leaves') return 'hr.leave';
    if (route === 'leave_types') return 'hr.leave.type';
    if (route === 'allocations') return 'hr.leave.allocation';
    if (route === 'cron') return 'ir.cron';
    if (route === 'server_actions') return 'ir.actions.server';
    if (route === 'sequences') return 'ir.sequence';
    if (route === 'audit_log') return 'audit.log';
    if (route === 'marketing/mailing_lists') return 'mailing.list';
    if (route === 'marketing/mailings') return 'mailing.mailing';
    if (route === 'manufacturing') return 'mrp.production';
    if (route === 'boms') return 'mrp.bom';
    if (route === 'workcenters') return 'mrp.workcenter';
    if (route === 'transfers') return 'stock.picking';
    if (route === 'warehouses') return 'stock.warehouse';
    if (route === 'lots') return 'stock.lot';
    if (route === 'purchase_orders') return 'purchase.order';
    if (route === 'invoices') return 'account.move';
    if (route === 'bank_statements') return 'account.bank.statement';
    if (route === 'account_reconcile_wizard') return 'account.reconcile.wizard';
    if (route === 'journals') return 'account.journal';
    if (route === 'accounts') return 'account.account';
    if (route === 'taxes') return 'account.tax';
    if (route === 'payment_terms') return 'account.payment.term';
    if (route === 'employees') return 'hr.employee';
    if (route === 'departments') return 'hr.department';
    if (route === 'jobs') return 'hr.job';
    if (route === 'attendances') return 'hr.attendance';
    if (route === 'applicants') return 'hr.applicant';
    if (route === 'recruitment') return 'hr.applicant';
    if (route === 'recruitment_stages') return 'hr.recruitment.stage';
    if (route === 'contracts') return 'hr.contract';
    if (route === 'time_off') return 'hr.leave';
    if (route === 'expenses') return 'hr.expense';
    if (route === 'fleet') return 'fleet.vehicle';
    if (route === 'projects') return 'project.project';
    if (route === 'timesheets') return 'analytic.line';
    if (route === 'project_todos') return 'project.task';
    if (route === 'recycle_models') return 'data.recycle.model';
    if (route === 'repair_orders') return 'repair.order';
    if (route === 'surveys') return 'survey.survey';
    if (route === 'lunch_orders') return 'lunch.order';
    if (route === 'livechat_channels') return 'im_livechat.channel';
    if (route === 'skills') return 'hr.skill';
    if (route === 'elearning') return 'slide.channel';
    if (route === 'analytic_accounts') return 'analytic.account';
    if (route === 'analytic_plans') return 'analytic.plan';
    if (route === 'pricelists') return 'product.pricelist';
    if (route === 'reordering_rules') return 'stock.warehouse.orderpoint';
    if (route === 'meetings') return 'calendar.event';
    if (route === 'tickets') return 'helpdesk.ticket';
    if (route === 'crm_stages') return 'crm.stage';
    if (route === 'crm_tags') return 'crm.tag';
    if (route === 'crm_lost_reasons') return 'crm.lost.reason';
    if (route === 'pos_orders') return 'pos.order';
    if (route === 'pos_sessions') return 'pos.session';
    return null;
  };

  if (typeof window !== 'undefined') {
    window.__ERP_getModelForRoute = R.getModelForRoute;
  }
})();
