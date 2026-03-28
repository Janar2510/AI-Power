/**
 * Phase 760: Discuss UI via RPC (mail.channel / mail.message) + hash routing.
 */
(function () {
  function esc(s) {
    return String(s || "").replace(/</g, "&lt;");
  }

  function render(main, opts) {
    opts = opts || {};
    if (!main) return false;
    var rpc = opts.rpc;
    if (!rpc || typeof rpc.callKw !== "function") return false;
    var showToast = opts.showToast || function () {};
    var channelIdOpt = opts.channelId;
    var bus = opts.bus;
    var session = opts.session;

    main.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "discuss-app o-discuss-app";
    wrap.innerHTML =
      '<div class="o-discuss-layout" style="display:grid;grid-template-columns:14rem 1fr;gap:var(--card-gap);min-height:20rem;align-items:stretch">' +
      '<aside class="o-discuss-sidebar o-card-gradient" style="padding:var(--space-md);border-radius:var(--radius-md)">' +
      "<h3>Channels</h3>" +
      '<button type="button" id="o-discuss-new-channel" class="o-btn o-btn-primary" style="width:100%;margin-bottom:var(--space-sm)">New Channel</button>' +
      '<ul id="o-discuss-channel-list" class="o-discuss-channel-list" style="list-style:none;margin:0;padding:0"></ul></aside>' +
      '<section class="o-discuss-thread o-card-gradient" style="padding:var(--space-md);border-radius:var(--radius-md);display:flex;flex-direction:column;min-height:16rem">' +
      '<div id="o-discuss-messages" class="o-discuss-messages" style="flex:1;overflow-y:auto;min-height:12rem"></div>' +
      '<div class="o-discuss-compose" style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--border-color)">' +
      '<textarea id="o-discuss-body" rows="2" class="o-list-search-field" style="width:100%;box-sizing:border-box" placeholder="Message…"></textarea>' +
      '<button type="button" id="o-discuss-send" class="o-btn o-btn-primary" style="margin-top:var(--space-sm)">Send</button></div></section></div>';

    main.appendChild(wrap);

    var listEl = main.querySelector("#o-discuss-channel-list");
    var msgEl = main.querySelector("#o-discuss-messages");
    var inputEl = main.querySelector("#o-discuss-body");
    var sendBtn = main.querySelector("#o-discuss-send");
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
          [[["res_model", "=", "mail.channel"], ["res_id", "=", cid]]],
          { fields: ["id", "body", "date", "author_id"], order: "id asc", limit: 80 }
        )
        .then(function (rows) {
          msgEl.innerHTML = (rows || [])
            .map(function (m) {
              return (
                '<div class="o-discuss-msg" style="margin-bottom:var(--space-sm);padding:var(--space-sm);background:var(--color-surface-2);border-radius:var(--radius-sm)">' +
                esc(m.body || "") +
                "</div>"
              );
            })
            .join("");
          msgEl.scrollTop = msgEl.scrollHeight;
        })
        .catch(function () {
          msgEl.innerHTML = '<p class="error o-list-load-error">Could not load messages</p>';
        });
    }

    function selectChannel(cid) {
      activeId = cid;
      if (typeof window !== "undefined" && window.location) {
        window.location.hash = cid ? "discuss/" + cid : "discuss";
      }
      main.querySelectorAll(".o-discuss-channel-list li").forEach(function (li) {
        li.style.fontWeight = li.dataset.id === String(cid) ? "bold" : "normal";
      });
      loadMessages(cid);
    }

    rpc
      .callKw("mail.channel", "search_read", [[]], { fields: ["id", "name", "channel_type"], limit: 50 })
      .then(function (channels) {
        listEl.innerHTML = "";
        var want = channelIdOpt ? parseInt(channelIdOpt, 10) : null;
        var picked = false;
        (channels || []).forEach(function (ch) {
          var li = document.createElement("li");
          li.style.cssText = "padding:var(--space-xs);cursor:pointer;border-radius:var(--radius-sm)";
          li.dataset.id = ch.id;
          li.textContent = ch.name || "Channel " + ch.id;
          li.onclick = function () {
            selectChannel(ch.id);
          };
          listEl.appendChild(li);
          if (want && ch.id === want) {
            picked = true;
            selectChannel(ch.id);
          }
        });
        if (!picked && channels && channels[0]) selectChannel(channels[0].id);
        else if (!channels || !channels.length) {
          msgEl.innerHTML = '<p style="color:var(--text-muted)">No channels. Create one.</p>';
        }
      })
      .catch(function () {
        listEl.innerHTML = '<li style="color:var(--text-muted)">No channels</li>';
      });

    main.querySelector("#o-discuss-new-channel").onclick = function () {
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
              selectChannel(ch.id);
            };
            listEl.appendChild(li);
          });
          if (channels && channels.length) selectChannel(channels[channels.length - 1].id);
        })
        .catch(function (err) {
          showToast((err && err.message) || "Failed to create channel", "error");
        });
    };

    sendBtn.onclick = function () {
      var body = (inputEl.value || "").trim();
      if (!body || !activeId) return;
      rpc
        .callKw("mail.channel", "message_post", [[activeId], body], { message_type: "comment" })
        .then(function () {
          inputEl.value = "";
          loadMessages(activeId);
        })
        .catch(function (err) {
          showToast((err && err.message) || "Send failed", "error");
        });
    };

    if (bus && session && session.getSessionInfo) {
      session.getSessionInfo().then(function (info) {
        var chs = ["res.partner_" + ((info && info.uid) || 1)];
        if (activeId) chs.push("mail.channel_" + activeId);
        try {
          bus.setChannels(chs);
          bus.start(chs);
        } catch (e) {}
      });
    }

    if (window._discussModuleBusListener) window.removeEventListener("bus:message", window._discussModuleBusListener);
    window._discussModuleBusListener = function (e) {
      var d = e.detail || {};
      var msg = d.message || {};
      if (msg.type === "message" && msg.res_model === "mail.channel" && activeId && msg.res_id == activeId) {
        var div = document.createElement("div");
        div.className = "o-discuss-msg";
        div.style.cssText = "margin-bottom:var(--space-sm);padding:var(--space-sm)";
        div.innerHTML = esc(msg.body || "");
        msgEl.appendChild(div);
        msgEl.scrollTop = msgEl.scrollHeight;
      }
    };
    window.addEventListener("bus:message", window._discussModuleBusListener);

    return true;
  }

  window.AppCore = window.AppCore || {};
  window.AppCore.DiscussViewModule = { render: render };
})();
