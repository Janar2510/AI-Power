"""Phase 631: DATA_ROUTES_SLUGS, menuToRoute literals, and getModelForRoute stay aligned.

Route tables live in legacy_main_route_tables.js / legacy_main_route_resolve.js (Phase 802 split).
main.js delegates via __ERP_ROUTE_LEGACY (RL.*).
"""

import re
import unittest
from pathlib import Path


def _main_js(root: Path) -> str:
    return (root / "addons/web/static/src/main.js").read_text(encoding="utf-8")


def _legacy_route_tables(root: Path) -> str:
    return (root / "addons/web/static/src/legacy_main_route_tables.js").read_text(encoding="utf-8")


def _legacy_route_resolve(root: Path) -> str:
    return (root / "addons/web/static/src/legacy_main_route_resolve.js").read_text(encoding="utf-8")


def _menu_utils(root: Path) -> str:
    return (root / "addons/web/static/src/app/menu_utils.js").read_text(encoding="utf-8")


def _data_route_slugs(tables_js: str) -> set[str]:
    m = re.search(
        r"R\.DATA_ROUTES_SLUGS\s*=\s*\n?\s*'([^']+)'",
        tables_js,
        re.MULTILINE,
    )
    if not m:
        m = re.search(
            r"var\s+DATA_ROUTES_SLUGS\s*=\s*'([^']+)'",
            tables_js,
            re.MULTILINE,
        )
    if not m:
        raise AssertionError("DATA_ROUTES_SLUGS not found in legacy_main_route_tables.js")
    return {s.strip() for s in m.group(1).split("|") if s.strip()}


def _menu_to_route_literals(tables_js: str) -> set[str]:
    start = tables_js.index("R.menuToRoute = function")
    block = tables_js[start:].split("\n  };", 1)[0]
    out = set(re.findall(r"return\s+'([^']+)'", block))
    out.update(re.findall(r'return\s+"([^"]+)"', block))
    return out


def _get_model_for_route_block(resolve_js: str) -> str:
    start = resolve_js.index("R.getModelForRoute = function")
    end = resolve_js.index("};", start)
    return resolve_js[start:end]


class TestMainJsRouteConsistencyPhase631(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent
        cls.js = _main_js(cls.root)
        cls.tables_js = _legacy_route_tables(cls.root)
        cls.resolve_js = _legacy_route_resolve(cls.root)
        cls.menu_utils_js = _menu_utils(cls.root)

    # menuToRoute string returns that are handled before list/new/edit regexes
    _EXEMPT_MENU_SLUGS = frozenset(
        {
            "home",
            "discuss",
            "settings",
            "settings/apikeys",
            "reports/trial-balance",
            "reports/stock-valuation",
        }
    )

    # Slugs in DATA_ROUTES that never reach getModelForRoute (handled earlier in routeApplyInternal)
    _EXEMPT_MODEL_SLUGS = frozenset({"website", "ecommerce"})

    def test_menu_to_route_literals_are_routable(self):
        literals = _menu_to_route_literals(self.tables_js)
        data = _data_route_slugs(self.tables_js)
        missing = []
        for slug in literals:
            if slug in self._EXEMPT_MENU_SLUGS:
                continue
            if slug in data:
                continue
            missing.append(slug)
        self.assertFalse(
            missing,
            "menuToRoute return slugs missing from DATA_ROUTES_SLUGS (or exempt): "
            + ", ".join(sorted(missing)),
        )

    def test_data_routes_have_get_model_branch_or_placeholder(self):
        data = _data_route_slugs(self.tables_js)
        gmf = _get_model_for_route_block(self.resolve_js)
        missing = []
        for slug in sorted(data):
            if slug in self._EXEMPT_MODEL_SLUGS:
                continue
            needle = f"route === '{slug}'"
            if needle not in gmf:
                missing.append(slug)
        self.assertFalse(
            missing,
            "DATA_ROUTES_SLUGS entries without getModelForRoute fallback (add if branch or exempt): "
            + ", ".join(missing),
        )

    def test_action_to_route_fleet_maps_to_data_slug(self):
        """fleet.vehicle must not fall through to generic underscore slug (fleet_vehicle)."""
        self.assertIn(
            "if (m === 'fleet_vehicle') return 'fleet';",
            self.tables_js,
        )

    def test_phase689_app_chrome_model_fallback_hook(self):
        """Expose getModelForRoute for menu_utils getAppIdForRoute second pass."""
        self.assertIn("window.__ERP_getModelForRoute = getModelForRoute", self.js)
        self.assertIn("infer app from res_model", self.menu_utils_js)
        self.assertIn("getModelForRoute", self.menu_utils_js)


if __name__ == "__main__":
    unittest.main()
