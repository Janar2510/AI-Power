(function () {
  window.UILayout = window.UILayout || {};

  window.UILayout.navbar = {
    render(container, options) {
      const opts = options || {};
      const wrapper = document.createElement("div");
      wrapper.className = "o-layout-navbar";

      const left = document.createElement("div");
      left.className = "o-layout-navbar-left";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "o-btn o-btn-secondary";
      toggle.textContent = "Menu";
      if (typeof opts.onToggleSidebar === "function") {
        toggle.addEventListener("click", opts.onToggleSidebar);
      }

      const title = document.createElement("strong");
      title.textContent = String(opts.title || "ERP Platform");

      left.appendChild(toggle);
      left.appendChild(title);

      const right = document.createElement("div");
      right.className = "o-layout-navbar-right";
      const user = document.createElement("span");
      user.className = "o-user-chip";
      user.textContent = String(opts.userName || "User");
      right.appendChild(user);

      wrapper.appendChild(left);
      wrapper.appendChild(right);
      container.innerHTML = "";
      container.appendChild(wrapper);
    },
  };
})();
