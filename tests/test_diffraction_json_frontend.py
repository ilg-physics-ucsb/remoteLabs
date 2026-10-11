import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "DiffractionInterference" / "index.html"
JSON_APP = ROOT / "DiffractionInterference" / "static" / "js" / "remlaJsonApp.js"
MAIN = ROOT / "DiffractionInterference" / "static" / "js" / "main.js"


class DiffractionJsonFrontendTests(unittest.TestCase):
    def test_page_uses_only_json_transport(self):
        content = INDEX.read_text(encoding="utf-8")

        self.assertIn('src="static/js/remlaJsonSocket.js"', content)
        self.assertIn('src="static/js/remlaJsonApp.js"', content)
        self.assertNotIn('src="static/js/remlaSocket.js"', content)
        self.assertNotIn('src="static/js/remlaJsonBridge.js"', content)
        self.assertLess(
            content.index('src="static/js/remlaJsonSocket.js"'),
            content.index('src="static/js/remlaJsonApp.js"'),
        )

    def test_json_app_exposes_direct_commands_and_events(self):
        content = JSON_APP.read_text(encoding="utf-8")

        self.assertIn("window.remlaCommand", content)
        self.assertIn("window.remlaJsonLatestState", content)
        self.assertIn("client.command(deviceName, commandName, commandParameters)", content)
        self.assertIn("client.pending.clear()", content)
        self.assertIn('name === "ownership.control"', content)
        self.assertIn('name === "ownership.handoff"', content)
        self.assertIn("window.remlaCommand", content)
        self.assertNotIn("dataChannel", content)
        for event_name in (
            "remla:state-snapshot",
            "remla:state-changed",
            "remla:ownership-queue",
            "remla:fault",
            "remla:command-error",
            "remla:camera-switch-started",
        ):
            self.assertIn(event_name, content)

    def test_power_controls_render_only_after_json_results(self):
        content = MAIN.read_text(encoding="utf-8")

        self.assertIn("function requestPowerCommand", content)
        self.assertIn('await remlaCommand(target, "power_" + commandName, [])', content)
        self.assertIn("var slitSelectionQueue = Promise.resolve()", content)
        self.assertIn("function queueSlitNudge", content)
        self.assertIn("var stageMovePending = false", content)
        self.assertIn("var ambientCommandPending = false", content)
        self.assertIn('window.addEventListener("remla:state-snapshot"', content)
        self.assertIn("window.remlaJsonLatestState", content)
        self.assertIn('window.addEventListener("remla:ownership-handoff"', content)
        self.assertNotIn("dataChannel", content)


if __name__ == "__main__":
    unittest.main()
