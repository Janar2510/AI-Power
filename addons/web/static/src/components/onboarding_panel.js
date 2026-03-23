(function () {
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderHTML(opts) {
    var o = opts || {};
    var key = String(o.storageKey || "onboarding");
    var steps = Array.isArray(o.steps) ? o.steps : [];
    var done = steps.filter(function (s) { return !!s.done; }).length;
    var folded = false;
    try {
      folded = localStorage.getItem("erp_onboarding_fold_" + key) === "1";
    } catch (e) {}
    var html = '<section class="o-onboarding-panel' + (folded ? " is-folded" : "") + '" data-onboarding-key="' + esc(key) + '">';
    html += '<header class="o-onboarding-head"><h3>Onboarding</h3><div class="o-onboarding-meta">' + done + "/" + steps.length + ' complete</div>';
    html += '<button type="button" class="o-onboarding-toggle o-btn o-btn-secondary">' + (folded ? "Expand" : "Collapse") + "</button></header>";
    html += '<div class="o-onboarding-progress"><span style="width:' + (steps.length ? Math.round((done / steps.length) * 100) : 0) + '%"></span></div>';
    html += '<ol class="o-onboarding-steps">';
    steps.forEach(function (s, idx) {
      html += '<li class="o-onboarding-step' + (s.done ? " is-done" : "") + '">';
      html += '<div class="o-onboarding-step-title">' + esc(s.title || ("Step " + (idx + 1))) + "</div>";
      if (s.description) html += '<div class="o-onboarding-step-desc">' + esc(s.description) + "</div>";
      if (s.actionLabel) html += '<button type="button" class="o-btn o-btn-secondary o-onboarding-action" data-step-idx="' + idx + '">' + esc(s.actionLabel) + "</button>";
      html += "</li>";
    });
    html += "</ol></section>";
    return html;
  }

  function wire(container, opts) {
    var o = opts || {};
    if (!container) return;
    var root = container.querySelector(".o-onboarding-panel");
    if (!root) return;
    var key = root.getAttribute("data-onboarding-key") || "onboarding";
    var btn = root.querySelector(".o-onboarding-toggle");
    if (btn) {
      btn.onclick = function () {
        root.classList.toggle("is-folded");
        var folded = root.classList.contains("is-folded");
        btn.textContent = folded ? "Expand" : "Collapse";
        try {
          localStorage.setItem("erp_onboarding_fold_" + key, folded ? "1" : "0");
        } catch (e) {}
      };
    }
    root.querySelectorAll(".o-onboarding-action").forEach(function (actionBtn) {
      actionBtn.onclick = function () {
        var idx = parseInt(actionBtn.getAttribute("data-step-idx"), 10);
        if (typeof o.onStepAction === "function") o.onStepAction(isNaN(idx) ? 0 : idx);
      };
    });
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.OnboardingPanel = {
    renderHTML: renderHTML,
    wire: wire,
  };
})();
