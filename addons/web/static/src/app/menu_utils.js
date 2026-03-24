export function getCurrentRoute() {
  const hash = String(window.location.hash || "#home").replace(/^#/, "");
  return hash.split("?")[0] || "home";
}

export function actionToRoute(action) {
  if (!action) return null;
  if (action.type === "ir.actions.act_url") {
    const rawUrl = String(action.url || "").trim();
    if (!rawUrl) return null;
    const hashIndex = rawUrl.indexOf("#");
    if (hashIndex >= 0) {
      const fragment = rawUrl.slice(hashIndex + 1).split("?")[0].trim();
      return fragment || null;
    }
    if (/^[a-z0-9_\-/]+$/i.test(rawUrl)) {
      return rawUrl;
    }
    return null;
  }
  if (action.type !== "ir.actions.act_window") return null;
  const modelSlug = String(action.res_model || "").replace(/\./g, "_");
  const byModel = {
    res_partner: "contacts",
    crm_lead: ((action.name || "").toLowerCase().indexOf("pipeline") >= 0) ? "pipeline" : (((action.name || "").toLowerCase().indexOf("activit") >= 0) ? "crm/activities" : "leads"),
    project_task: "tasks",
    knowledge_article: "articles",
    knowledge_category: "knowledge_categories",
    sale_order: "orders",
    sale_subscription: "subscriptions",
    product_product: "products",
    ir_attachment: "attachments",
    res_users: "settings/users",
    approval_rule: "settings/approval_rules",
    approval_request: "settings/approval_requests",
    hr_leave: "leaves",
    hr_leave_type: "leave_types",
    hr_leave_allocation: "allocations",
    ir_cron: "cron",
    ir_actions_server: "server_actions",
    ir_sequence: "sequences",
    mrp_production: "manufacturing",
    mrp_bom: "boms",
    mrp_workcenter: "workcenters",
    stock_picking: "transfers",
    stock_warehouse: "warehouses",
    stock_lot: "lots",
    purchase_order: "purchase_orders",
    account_move: "invoices",
    account_bank_statement: "bank_statements",
    account_reconcile_wizard: "account_reconcile_wizard",
    account_journal: "journals",
    account_account: "accounts",
    account_tax: "taxes",
    account_payment_term: "payment_terms",
    hr_employee: "employees",
    hr_department: "departments",
    hr_job: "jobs",
    hr_attendance: "attendances",
    hr_applicant: "applicants",
    hr_contract: "contracts",
    project_project: "projects",
    calendar_event: "meetings",
    helpdesk_ticket: "tickets",
    analytic_line: "timesheets",
    analytic_account: "analytic_accounts",
    analytic_plan: "analytic_plans",
    product_pricelist: "pricelists",
    stock_warehouse_orderpoint: "reordering_rules",
    hr_expense: "expenses",
    repair_order: "repair_orders",
    survey_survey: "surveys",
    lunch_order: "lunch_orders",
    im_livechat_channel: "livechat_channels",
    data_recycle_model: "recycle_models",
    hr_skill: "skills",
    slide_channel: "elearning",
    audit_log: "audit_log",
    mailing_list: "marketing/mailing_lists",
    mailing_mailing: "marketing/mailings",
    crm_stage: "crm_stages",
    crm_tag: "crm_tags",
    crm_lost_reason: "crm_lost_reasons",
  };
  return byModel[modelSlug] || modelSlug || null;
}

export function menuToRoute(menu) {
  if (!menu) return null;
  const name = String(menu.name || "").toLowerCase();
  const known = {
    home: "home",
    settings: "settings",
    "api keys": "settings/apikeys",
    contacts: "contacts",
    crm: "pipeline",
    leads: "leads",
    "my pipeline": "pipeline",
    "my activities": "crm/activities",
    discuss: "discuss",
    orders: "orders",
    products: "products",
    tasks: "tasks",
    invoicing: "invoices",
    inventory: "transfers",
    sales: "orders",
    hr: "employees",
    employees: "employees",
    departments: "departments",
    "job positions": "jobs",
    jobs: "jobs",
    expenses: "expenses",
    "my expenses": "expenses",
    attendances: "attendances",
    attendance: "attendances",
    recruitment: "recruitment",
    applicants: "applicants",
    "time off": "time_off",
    repairs: "repair_orders",
    surveys: "surveys",
    lunch: "lunch_orders",
    "live chat": "livechat_channels",
    "to-do": "project_todos",
    "data recycle": "recycle_models",
    skills: "skills",
    elearning: "elearning",
    "analytic plans": "analytic_plans",
    subscriptions: "subscriptions",
    meetings: "meetings",
    "recruitment stages": "recruitment_stages",
    valuation: "reports/stock-valuation",
    valuations: "reports/stock-valuation",
    "stock valuation report": "reports/stock-valuation",
    website: "website",
    ecommerce: "ecommerce",
    reports: "reports/trial-balance",
    stages: "crm_stages",
    tags: "crm_tags",
    "lost reasons": "crm_lost_reasons",
  };
  if (known[name]) {
    return known[name];
  }
  const slug = name.trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const sectionOnly = { configuration: true, reporting: true, operations: true, sales: true, technical: true };
  if (slug && !sectionOnly[slug]) {
    return slug;
  }
  return null;
}

export function buildMenuTree(menus) {
  const byId = {};
  const roots = [];
  (menus || []).forEach(function (menu) {
    byId[menu.id || menu.name] = { menu: menu, children: [] };
  });
  (menus || []).forEach(function (menu) {
    const node = byId[menu.id || menu.name];
    if (!node) return;
    const parentRef = menu.parent || "";
    if (!parentRef || !byId[parentRef]) {
      roots.push(node);
    } else {
      byId[parentRef].children.push(node);
    }
  });
  function sortRecursive(nodes) {
    nodes.sort(function (left, right) {
      return (left.menu.sequence || 0) - (right.menu.sequence || 0);
    });
    nodes.forEach(function (node) {
      if (node.children.length) {
        sortRecursive(node.children);
      }
    });
  }
  sortRecursive(roots);
  return roots;
}

export function getAppRoots(tree, menus) {
  const byId = {};
  (menus || []).forEach(function (menu) {
    if (menu && menu.id) {
      byId[menu.id] = menu;
    }
  });
  return (tree || []).filter(function (node) {
    const menu = node.menu || {};
    if (!menu.id) return false;
    if (menu.app_id) {
      return menu.id === menu.app_id;
    }
    return !menu.parent || !byId[menu.parent];
  });
}

export function getAppIdForRoute(route, menus, viewsService) {
  let match = null;
  (menus || []).some(function (menu) {
    const action = menu.action && viewsService ? viewsService.getAction(menu.action) : null;
    const resolvedRoute = action ? actionToRoute(action) : menuToRoute(menu);
    if (resolvedRoute && resolvedRoute === route) {
      match = menu.app_id || menu.id || null;
      return true;
    }
    return false;
  });
  return match;
}

export function getDefaultRouteForAppNode(node, viewsService) {
  if (!node) return null;
  const queue = [node];
  while (queue.length) {
    const current = queue.shift();
    const menu = current && current.menu ? current.menu : null;
    if (menu) {
      const action = menu.action && viewsService ? viewsService.getAction(menu.action) : null;
      const route = action ? actionToRoute(action) : menuToRoute(menu);
      if (route) return route;
    }
    const children = current && current.children ? current.children : [];
    for (let index = 0; index < children.length; index += 1) {
      queue.push(children[index]);
    }
  }
  return null;
}
