"""Phase 631: DATA_ROUTES_SLUGS, menuToRoute literals, and getModelForRoute stay aligned."""

import re
import unittest
from pathlib import Path


def _main_js(root: Path) -> str:
    return (root / "addons/web/static/src/main.js").read_text(encoding="utf-8")


def _data_route_slugs(js: str) -> set[str]:
    m = re.search(
        r"var\s+DATA_ROUTES_SLUGS\s*=\s*'([^']+)'",
        js,
        re.MULTILINE,
    )
    if not m:
        raise AssertionError("DATA_ROUTES_SLUGS not found")
    return {s.strip() for s in m.group(1).split("|") if s.strip()}


def _menu_to_route_literals(js: str) -> set[str]:
    start = js.index("function menuToRoute")
    end = js.index("function getActionForRoute", start)
    block = js[start:end]
    out = set(re.findall(r"return\s+'([^']+)'", block))
    out.update(re.findall(r'return\s+"([^"]+)"', block))
    return out


def _get_model_for_route_block(js: str) -> str:
    start = js.index("function getModelForRoute")
    end = js.index("function parseActionDomain", start)
    return js[start:end]


class TestMainJsRouteConsistencyPhase631(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = Path(__file__).resolve().parent.parent
        cls.js = _main_js(cls.root)

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
        literals = _menu_to_route_literals(self.js)
        data = _data_route_slugs(self.js)
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
        data = _data_route_slugs(self.js)
        gmf = _get_model_for_route_block(self.js)
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
            self.js,
        )

    def test_phase689_app_chrome_model_fallback_hook(self):
        """Expose getModelForRoute for menu_utils getAppIdForRoute second pass."""
        self.assertIn("window.__ERP_getModelForRoute = getModelForRoute", self.js)
        self.assertIn("infer app from model", self.js)
        self.assertIn("getModelForRoute(route)", self.js)


if __name__ == "__main__":
    unittest.main()
