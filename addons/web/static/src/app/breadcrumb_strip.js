/**
 * Phase 574: modular breadcrumb HTML — legacy renderBreadcrumbs delegates when registered.
 */

function escLabel(s) {
  return String(s == null ? "" : s).replace(/</g, "&lt;");
}

/**
 * @param {Array<{label?: string, hash?: string}>} actionStack
 * @returns {string}
 */
export function buildBreadcrumbsHtml(actionStack) {
  const stack = Array.isArray(actionStack) ? actionStack : [];
  if (window.UIComponents && window.UIComponents.Breadcrumbs && typeof window.UIComponents.Breadcrumbs.renderHTML === "function") {
    return window.UIComponents.Breadcrumbs.renderHTML(stack);
  }
  if (stack.length <= 1) return "";
  let html = '<nav class="breadcrumbs" aria-label="Breadcrumb">';
  stack.forEach(function (entry, i) {
    if (i === stack.length - 1) {
      html += '<span class="breadcrumb-item active">' + escLabel(entry.label) + "</span>";
    } else {
      html +=
        '<a class="breadcrumb-item" href="javascript:void(0)" data-bc-idx="' +
        i +
        '">' +
        escLabel(entry.label) +
        "</a>";
      html += '<span class="breadcrumb-sep">/</span>';
    }
  });
  html += "</nav>";
  return html;
}
