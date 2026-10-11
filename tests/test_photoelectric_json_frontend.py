import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PHOTO_PAGE = ROOT / "PhotoElectricEffect" / "zindex.html"
PHOTO_APP = ROOT / "PhotoElectricEffect" / "static" / "js" / "app.js"
TOGGLE = ROOT / "static" / "js" / "components" / "toggle.js"
KNOB = ROOT / "static" / "js" / "components" / "knob.js"
IMAGE_MAP_DEVICE = ROOT / "static" / "js" / "components" / "imgMapDevice.js"
JSON_APP = ROOT / "static" / "js" / "remlaJsonApp.js"
PHOTO_CONFIG = ROOT / "photo1.yml"


class PhotoelectricJsonFrontendTests(unittest.TestCase):
    def test_photoelectric_page_loads_only_json_transport(self):
        content = PHOTO_PAGE.read_text(encoding="utf-8")

        self.assertIn("remlaJsonSocket.js", content)
        self.assertIn("remlaJsonApp.js", content)
        self.assertNotIn("remlaSocket.js", content)
        self.assertNotIn("dataChannel", content)
        self.assertIn('device-name="HgNeLamp"', content)
        self.assertIn('device-name="Pot"', content)
        self.assertTrue(JSON_APP.exists())

    def test_components_emit_structured_commands(self):
        for path in (TOGGLE, KNOB, IMAGE_MAP_DEVICE):
            content = path.read_text(encoding="utf-8")
            self.assertIn("remla-command", content)
            self.assertIn("deviceName", content)
            self.assertIn("commandName", content)
        self.assertIn("setPending", TOGGLE.read_text(encoding="utf-8"))

    def test_photoelectric_app_maps_component_events_to_json_commands(self):
        content = PHOTO_APP.read_text(encoding="utf-8")

        self.assertIn("window.remlaCommand", content)
        self.assertIn('"remla-command"', content)
        self.assertIn('"HgNeLamp"', content)
        self.assertIn('"remla:state-snapshot"', content)
        self.assertIn('"remla:ownership-handoff"', content)
        self.assertIn("remlaJsonPendingHandoff", content)

    def test_photoelectric_power_routes_use_named_secret_and_consumers(self):
        content = PHOTO_CONFIG.read_text(encoding="utf-8")

        self.assertIn("password: ${secret:pepdu-password}", content)
        self.assertIn("type: PowerConsumer", content)
        self.assertIn("provider: PEpdu", content)
        self.assertIn("- HgNeLamp", content)
        self.assertIn("- Ambient", content)


if __name__ == "__main__":
    unittest.main()
