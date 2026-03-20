(function () {
  window.UIComponents = window.UIComponents || {};

  window.UIComponents.Card = function Card(options) {
    const opts = options || {};
    const card = document.createElement("section");
    card.className = "o-card" + (opts.gradient ? " o-card-gradient" : "");
    if (opts.title) {
      const header = document.createElement("header");
      header.className = "o-card-header";
      header.textContent = String(opts.title);
      card.appendChild(header);
    }
    const body = document.createElement("div");
    body.className = "o-card-body";
    if (opts.content instanceof Node) {
      body.appendChild(opts.content);
    } else {
      body.textContent = String(opts.content || "");
    }
    card.appendChild(body);
    if (opts.footer) {
      const footer = document.createElement("footer");
      footer.className = "o-card-footer";
      if (opts.footer instanceof Node) {
        footer.appendChild(opts.footer);
      } else {
        footer.textContent = String(opts.footer);
      }
      card.appendChild(footer);
    }
    return card;
  };
})();
