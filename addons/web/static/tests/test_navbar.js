(function () {
  var H = window.TestHelpers;
  var Navbar = window.AppCore && window.AppCore.Navbar;

  function createNavbarHost() {
    var container = H.createContainer();
    var navbar = document.createElement("div");
    navbar.id = "navbar";
    container.appendChild(navbar);
    return { container: container, navbar: navbar };
  }

  function cleanupHost(host) {
    if (!host) return;
    H.removeContainer(host.container);
    document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.removeItem("erp_theme");
    } catch (_e) {}
  }

  function sampleOptions(navbar) {
    return {
      navbar: navbar,
      brandName: "Foundry One",
      navItems: [
        {
          id: "sales",
          name: "Sales",
          href: "#orders",
          children: [
            { id: "orders", name: "Orders", href: "#orders" },
            { id: "quotes", name: "Quotations", href: "#quotes" },
          ],
        },
      ],
      userCompanies: {
        current_company: { id: 1, name: "HQ" },
        allowed_companies: [
          { id: 1, name: "HQ" },
          { id: 2, name: "EU Branch" },
        ],
      },
      userLangs: [
        { code: "en_US", name: "English" },
        { code: "et_EE", name: "Estonian" },
      ],
      currentLang: "en_US",
    };
  }

  function click(el) {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }

  function pressEscape() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };

    function test(name, fn) {
      try {
        fn();
        results.pass += 1;
      } catch (e) {
        results.fail += 1;
        results.errors.push(name + ": " + e.message);
      }
    }

    if (!Navbar || typeof Navbar.render !== "function") {
      results.fail += 1;
      results.errors.push("AppCore.Navbar.render not found");
      return Promise.resolve(results);
    }

    test("navbar core renders Foundry One shell without inline styles", function () {
      var host = createNavbarHost();
      try {
        var handled = Navbar.render(sampleOptions(host.navbar));
        H.assertTrue(handled, "Navbar render should handle the shell");
        H.assertTrue(!!host.navbar.querySelector(".o-navbar-shell"), "Shell class missing");
        H.assertTrue(!!host.navbar.querySelector(".o-navbar-brand-wordmark"), "Brand wordmark missing");
        H.assertTrue(host.navbar.textContent.indexOf("Foundry One") >= 0, "Foundry One should appear in navbar");
        H.assertEqual(host.navbar.innerHTML.indexOf("style="), -1, "Navbar output should not contain inline styles");
      } finally {
        cleanupHost(host);
      }
    });

    test("theme toggle updates root theme and persistence", function () {
      var host = createNavbarHost();
      try {
        localStorage.setItem("erp_theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
        Navbar.render(sampleOptions(host.navbar));
        var toggle = host.navbar.querySelector(".theme-toggle");
        H.assertTrue(!!toggle, "Theme toggle missing");
        click(toggle);
        H.assertEqual(document.documentElement.getAttribute("data-theme"), "dark", "Theme should switch to dark");
        H.assertEqual(localStorage.getItem("erp_theme"), "dark", "Theme should persist");
      } finally {
        cleanupHost(host);
      }
    });

    test("dropdown opens on click and closes on escape", function () {
      var host = createNavbarHost();
      try {
        Navbar.render(sampleOptions(host.navbar));
        var trigger = host.navbar.querySelector(".company-switcher-btn");
        var panel = host.navbar.querySelector(".company-dropdown");
        H.assertTrue(!!trigger, "Company switcher trigger missing");
        H.assertTrue(!!panel, "Company dropdown missing");
        H.assertTrue(panel.hasAttribute("hidden"), "Dropdown should start hidden");
        click(trigger);
        H.assertFalse(panel.hasAttribute("hidden"), "Dropdown should open on click");
        H.assertEqual(trigger.getAttribute("aria-expanded"), "true", "Trigger should reflect open state");
        pressEscape();
        H.assertTrue(panel.hasAttribute("hidden"), "Dropdown should close on escape");
        H.assertEqual(trigger.getAttribute("aria-expanded"), "false", "Trigger should reflect closed state");
      } finally {
        cleanupHost(host);
      }
    });

    return Promise.resolve(results);
  }

  window.Tests = window.Tests || {};
  window.Tests.navbar = run;
})();
