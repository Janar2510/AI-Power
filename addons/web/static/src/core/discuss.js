/**
 * Discuss app — channel list + thread + composer (Phase 413).
 */
(function () {
  var _impl = null;

  function setImpl(fn) {
    _impl = typeof fn === "function" ? fn : null;
  }

  function esc(s) {
    return String(s || "").replace(/</g, "&lt;");
  }

  function render(container, opts) {
    if (_impl) return !!_impl(container, opts || {});
    opts = opts || {};
    var rpc = window.Services && window.Services.rpc;
    if (!rpc || !container) return false;

    container.innerHTML =
      '<div class="discuss-app" style="display:flex;gap:var(--space-lg);min-height:20rem">' +
      '<aside class="discuss-channels" style="width:14rem;flex-shrink:0;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-sm);background:var(--color-surface-2)">' +
      '<h3 style="margin:0 0 var(--space-sm);font-size:0.95rem">Channels</h3><ul class="discuss-channel-list" style="list-style:none;margin:0;padding:0"></ul>' +
      '<button type="button" class="discuss-new-channel o-btn o-btn-secondary" style="width:100%;margin-top:var(--space-sm)">New channel</button></aside>' +
      '<section class="discuss-thread" style="flex:1;display:flex;flex-direction:column;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--color-surface-1)">' +
      '<div class="discuss-messages" style="flex:1;overflow-y:auto;padding:var(--space-md);font-size:0.9rem"></div>' +
      '<div style="padding:var(--space-md);border-top:1px solid var(--border-color)">' +
      '<textarea class="discuss-input" rows="2" placeholder="Message…" style="width:100%;padding:var(--space-sm);border-radius:var(--radius-sm);border:1px solid var(--border-color);background:var(--color-surface-1)"></textarea>' +
      '<button type="button" class="discuss-send o-btn o-btn-primary" style="margin-top:var(--space-sm)">Send</button></div></section></div>';

    var listEl = container.querySelector(".discuss-channel-list");
    var msgEl = container.querySelector(".discuss-messages");
    var inputEl = container.querySelector(".discuss-input");
    var activeId = null;

    function loadMessages(cid) {
      if (!cid) {
        msgEl.innerHTML = '<p style="color:var(--text-muted)">Select a channel</p>';
        return;
      }
      rpc
        .callKw(
          "mail.message",
          "search_read",
          [["res_model", "=", "mail.channel"], ["res_id", "=", cid]],
          { fields: ["id", "body", "date", "author_id"], order: "id asc", limit: 80 }
        )
        .then(function (rows) {
          msgEl.innerHTML = (rows || [])
            .map(function (m) {
              return (
                '<div class="discuss-msg" style="margin-bottom:var(--space-sm);padding:var(--space-sm);background:var(--color-surface-2);border-radius:var(--radius-sm)">' +
                esc(m.body || "") +
                "</div>"
              );
            })
            .join("");
          msgEl.scrollTop = msgEl.scrollHeight;
        })
        .catch(function () {
          msgEl.innerHTML = '<p class="error" style="color:#c00">Could not load messages</p>';
        });
    }

    function selectChannel(cid, name) {
      activeId = cid;
      container.querySelectorAll(".discuss-channel-list li").forEach(function (li) {
        li.style.fontWeight = li.dataset.id === String(cid) ? "bold" : "normal";
      });
      loadMessages(cid);
    }

    rpc
      .callKw("mail.channel", "search_read", [[]], { fields: ["id", "name", "channel_type"], limit: 50 })
      .then(function (channels) {
        listEl.innerHTML = "";
        (channels || []).forEach(function (ch) {
          var li = document.createElement("li");
          li.style.cssText = "padding:var(--space-xs);cursor:pointer;border-radius:var(--radius-sm)";
          li.dataset.id = ch.id;
          li.textContent = ch.name || "Channel " + ch.id;
          li.onclick = function () {
            selectChannel(ch.id, ch.name);
          };
          listEl.appendChild(li);
        });
        if (channels && channels[0]) selectChannel(channels[0].id, channels[0].name);
      })
      .catch(function () {
        listEl.innerHTML = '<li style="color:var(--text-muted)">No channels</li>';
      });

    container.querySelector(".discuss-new-channel").onclick = function () {
      var n = window.prompt("Channel name");
      if (!n) return;
      rpc
        .callKw("mail.channel", "create", [[{ name: n, channel_type: "channel" }]], {})
        .then(function () {
          return rpc.callKw("mail.channel", "search_read", [[]], { fields: ["id", "name"], limit: 50 });
        })
        .then(function (channels) {
          listEl.innerHTML = "";
          (channels || []).forEach(function (ch) {
            var li = document.createElement("li");
            li.style.cssText = "padding:var(--space-xs);cursor:pointer";
            li.dataset.id = ch.id;
            li.textContent = ch.name || String(ch.id);
            li.onclick = function () {
              selectChannel(ch.id, ch.name);
            };
            listEl.appendChild(li);
          });
        });
    };

    container.querySelector(".discuss-send").onclick = function () {
      var body = (inputEl.value || "").trim();
      if (!body || !activeId) return;
      rpc
        .callKw("mail.channel", "message_post", [[activeId], body], { message_type: "comment" })
        .then(function () {
          inputEl.value = "";
          loadMessages(activeId);
        })
        .catch(function (err) {
          window.alert(err && err.message ? err.message : "Send failed");
        });
    };

    if (window.Services && window.Services.bus) {
      try {
        window.Services.bus.start(["mail.channel_" + (opts.uid || "")]);
      } catch (e) {}
    }
    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.DiscussView = {
    setImpl: setImpl,
    render: render,
  };
})();
