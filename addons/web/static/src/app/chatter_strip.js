/**
 * Phase 597: Form chatter chrome — modular HTML + message row rendering (form-view spec adjunct).
 * Tokens only on shell; legacy main.js delegates when AppCore.ChatterStrip is registered (modern bundle).
 */

function escAttr(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ model: string, label?: string }} options
 */
export function buildChatterChromeHtml(options) {
  var model = (options && options.model) || "";
  var label = (options && options.label) || "Messages";
  return (
    "<p><label>" +
    escAttr(label) +
    '</label><div id="chatter-messages" class="o-chatter o-chatter-chrome o-card-gradient" data-model="' +
    escAttr(model) +
    '">' +
    '<header class="o-chatter-chrome-head" aria-label="Discussion">' +
    '<span class="o-chatter-chrome-title">Activity</span>' +
    "</header>" +
    '<div class="chatter-messages-list o-chatter-messages-scroll"></div>' +
    '<div class="chatter-compose o-chatter-compose">' +
    '<textarea id="chatter-input" class="o-chatter-textarea" placeholder="Add a comment..." rows="3"></textarea>' +
    '<div class="o-chatter-compose-row">' +
    '<input type="file" id="chatter-file" class="o-chatter-file" multiple />' +
    '<span id="chatter-attachments" class="o-chatter-attachments-hint"></span>' +
    "</div>" +
    '<label class="o-chatter-send-email-label">' +
    '<input type="checkbox" id="chatter-send-email" /> Send as email' +
    "</label>" +
    '<button type="button" id="chatter-send" class="o-btn o-btn-primary o-chatter-send">Send</button>' +
    "</div></div></p>"
  );
}

function escapeBodyText(body) {
  return String(body || "")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br>");
}

/**
 * @param {HTMLElement} container
 * @param {Array<object>} rows mail.message search_read rows
 * @param {Record<number,string>} nameMap author_id -> display name
 */
export function appendChatterRows(container, rows, nameMap) {
  if (!container) return;
  container.innerHTML = "";
  nameMap = nameMap || {};
  if (!rows || !rows.length) {
    container.innerHTML = '<p class="o-chatter-empty">No messages yet.</p>';
    return;
  }
  rows.forEach(function (r) {
    var authorName = r.author_id
      ? nameMap[r.author_id] ||
        "User #" +
        (Array.isArray(r.author_id) ? r.author_id[0] : r.author_id)
      : "Unknown";
    var dateStr = r.date ? String(r.date).replace("T", " ").slice(0, 16) : "";
    var body = escapeBodyText(r.body || "");
    var attHtml = "";
    var aids = r.attachment_ids || [];
    if (aids.length) {
      var ids = aids.map(function (x) {
        return Array.isArray(x) ? x[0] : x;
      });
      attHtml =
        '<div class="o-chatter-attachments">' +
        ids
          .map(function (aid) {
            return (
              '<a href="/web/attachment/download/' +
              encodeURIComponent(String(aid)) +
              '" target="_blank" rel="noopener" class="o-chatter-attachment-link">Attachment</a>'
            );
          })
          .join("") +
        "</div>";
    }
    var div = document.createElement("div");
    div.className = "chatter-msg o-chatter-msg";
    div.innerHTML =
      '<div class="o-chatter-msg-meta">' +
      escAttr(authorName) +
      " · " +
      escAttr(dateStr) +
      "</div>" +
      '<div class="o-chatter-msg-body">' +
      body +
      "</div>" +
      attHtml;
    container.appendChild(div);
  });
}

export function setChatterError(container, message) {
  if (!container) return;
  container.innerHTML = '<p class="o-chatter-error">' + escAttr(message || "Could not load messages.") + "</p>";
}
