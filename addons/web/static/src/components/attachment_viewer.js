(function () {
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function open(items, startIndex) {
    var list = Array.isArray(items) ? items : [];
    if (!list.length) return null;
    var idx = Math.max(0, Math.min(parseInt(startIndex || 0, 10) || 0, list.length - 1));
    var host = document.createElement("div");
    host.className = "o-attachment-viewer";
    host.innerHTML =
      '<div class="o-attachment-backdrop"></div>' +
      '<div class="o-attachment-card" role="dialog" aria-modal="true">' +
      '<div class="o-attachment-head"><div class="o-attachment-title"></div>' +
      '<div class="o-attachment-nav"><button type="button" class="o-btn o-btn-secondary o-attachment-prev">Prev</button>' +
      '<button type="button" class="o-btn o-btn-secondary o-attachment-next">Next</button>' +
      '<button type="button" class="o-btn o-btn-secondary o-attachment-close">Close</button></div></div>' +
      '<div class="o-attachment-body"></div></div>';
    document.body.appendChild(host);
    var prevFocus = document.activeElement;
    var card = host.querySelector(".o-attachment-card");
    if (card) card.setAttribute("tabindex", "-1");

    function close() {
      document.removeEventListener("keydown", onKey);
      host.remove();
      if (prevFocus && typeof prevFocus.focus === "function") {
        try {
          prevFocus.focus();
        } catch (e) {}
      }
    }

    function render() {
      var item = list[idx] || {};
      var name = item.name || "Attachment";
      var url = item.url || "#";
      var mime = (item.mimetype || "").toLowerCase();
      var body = host.querySelector(".o-attachment-body");
      var title = host.querySelector(".o-attachment-title");
      if (title) title.textContent = name;
      if (!body) return;
      if (mime.indexOf("image/") === 0) {
        body.innerHTML = '<img class="o-attachment-image" src="' + esc(url) + '" alt="' + esc(name) + '">';
      } else if (mime.indexOf("pdf") >= 0) {
        body.innerHTML = '<iframe class="o-attachment-pdf" src="' + esc(url) + '" title="' + esc(name) + '"></iframe>';
      } else if (mime.indexOf("video/") === 0) {
        body.innerHTML =
          '<video class="o-attachment-video" controls src="' + esc(url) + '" title="' + esc(name) + '"></video>';
      } else if (mime.indexOf("text/") === 0) {
        body.innerHTML =
          '<iframe class="o-attachment-text" src="' + esc(url) + '" title="' + esc(name) + '"></iframe>';
      } else {
        body.innerHTML = '<a class="o-btn o-btn-primary" href="' + esc(url) + '" target="_blank" rel="noopener">Download</a>';
      }
    }

    function move(delta) {
      if (!list.length) return;
      idx = (idx + delta + list.length) % list.length;
      render();
    }

    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    }

    host.querySelector(".o-attachment-prev").onclick = function () { move(-1); };
    host.querySelector(".o-attachment-next").onclick = function () { move(1); };
    host.querySelector(".o-attachment-close").onclick = close;
    host.querySelector(".o-attachment-backdrop").onclick = close;
    document.addEventListener("keydown", onKey);
    render();
    window.requestAnimationFrame(function () {
      var closeBtn = host.querySelector(".o-attachment-close");
      if (closeBtn && typeof closeBtn.focus === "function") {
        try {
          closeBtn.focus();
        } catch (e) {}
      }
    });
    return { close: close };
  }

  window.UIComponents = window.UIComponents || {};
  window.UIComponents.AttachmentViewer = {
    open: open,
    /** @deprecated Use open() — alias for file preview parity */
    openFilePreview: open,
  };
})();
