"""Phase 121: Module scaffold CLI - erp-bin scaffold creates valid module structure."""

import tempfile
import unittest
from pathlib import Path

from core.cli.scaffold import Scaffold


class TestScaffoldPhase121(unittest.TestCase):
    """Test scaffold command creates valid module structure."""

    def test_scaffold_creates_module_structure(self):
        """Scaffold creates __manifest__.py, models, views, security, etc."""
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "addons"
            dest.mkdir()
            cmd = Scaffold()
            cmd.run(["test_module", str(dest)])

            module_path = dest / "test_module"
            self.assertTrue(module_path.is_dir(), "Module directory created")

            manifest = module_path / "__manifest__.py"
            self.assertTrue(manifest.exists(), "__manifest__.py exists")
            content = manifest.read_text()
            self.assertIn("'name'", content)
            self.assertIn("test_module", content)
            self.assertIn("'depends'", content)
            self.assertIn("'base'", content)

            self.assertTrue((module_path / "__init__.py").exists())
            self.assertTrue((module_path / "models" / "__init__.py").exists())
            self.assertTrue((module_path / "models" / "test_module.py").exists())
            self.assertTrue((module_path / "views" / "views.xml").exists())
            self.assertTrue((module_path / "views" / "templates.xml").exists())
            self.assertTrue((module_path / "security" / "ir.model.access.csv").exists())
            self.assertTrue((module_path / "controllers" / "__init__.py").exists())
            self.assertTrue((module_path / "controllers" / "controllers.py").exists())

    def test_scaffold_snake_case_name(self):
        """Scaffold converts CamelCase to snake_case for module name."""
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "addons"
            dest.mkdir()
            cmd = Scaffold()
            cmd.run(["MyCustomModule", str(dest)])

            module_path = dest / "my_custom_module"
            self.assertTrue(module_path.is_dir(), "CamelCase -> snake_case")
            self.assertTrue((module_path / "__manifest__.py").exists())
