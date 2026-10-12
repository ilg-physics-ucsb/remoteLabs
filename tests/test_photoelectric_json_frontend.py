import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PHOTO_PAGE = ROOT / "PhotoElectricEffect" / "zindex.html"
PHOTO_APP = ROOT / "PhotoElectricEffect" / "static" / "js" / "app.js"
TOGGLE = ROOT / "static" / "js" / "components" / "toggle.js"
KNOB = ROOT / "static" / "js" / "components" / "knob.js"
IMAGE_MAP_DEVICE = ROOT / "static" / "js" / "components" / "imgMapDevice.js"
VIDEO = ROOT / "static" / "js" / "components" / "video.js"
JSON_APP = ROOT / "static" / "js" / "remlaJsonApp.js"
PHOTO_CONFIG = ROOT / "photo1.yml"


class PhotoelectricJsonFrontendTests(unittest.TestCase):
    def test_photoelectric_page_loads_only_json_transport(self):
        content = PHOTO_PAGE.read_text(encoding="utf-8")

        self.assertIn("remlaJsonSocket.js", content)
        self.assertIn("remlaJsonApp.js", content)
        self.assertNotIn("remlaSocket.js", content)
        self.assertNotIn("dataChannel", content)
        self.assertNotIn("../static/", content)
        self.assertIn('href="static/css/app.css"', content)
        self.assertIn('src="static/js/reader.js"', content)
        self.assertIn('src="static/js/remlaJsonSocket.js"', content)
        self.assertIn('src="static/js/remlaJsonApp.js"', content)
        self.assertIn('src="static/js/lib.js"', content)
        self.assertIn('device-name="HgNeLamp"', content)
        self.assertIn('device-name="Pot"', content)
        self.assertTrue(JSON_APP.exists())

    def test_video_component_uses_the_local_mediamtx_whep_feed(self):
        page = PHOTO_PAGE.read_text(encoding="utf-8")
        component = VIDEO.read_text(encoding="utf-8")

        self.assertIn("reader.js", page)
        self.assertIn("MediaMTXWebRTCReader", component)
        self.assertIn('new URL("whep", window.location.href)', component)
        self.assertIn("video.srcObject = event.streams[0]", component)
        self.assertNotIn("mdnplay.dev", component)
        self.assertIn("disconnectedCallback", component)
        self.assertIn("this.whepReader.close()", component)
        self.assertIn("this.componentInitialized", component)
        self.assertIn("this.whepReader !== reader", component)
        self.assertIn("params.set('remla_reload'", component)

    def test_components_emit_structured_commands(self):
        for path in (TOGGLE, KNOB, IMAGE_MAP_DEVICE):
            content = path.read_text(encoding="utf-8")
            self.assertIn("remla-command", content)
            self.assertIn("deviceName", content)
            self.assertIn("commandName", content)
            self.assertNotIn("...arguments", content)
        self.assertIn("setPending", TOGGLE.read_text(encoding="utf-8"))
        self.assertIn("'static/imgs/figma-components/lightSwitchON.png'", TOGGLE.read_text(encoding="utf-8"))
        self.assertNotIn("'../static/imgs/figma-components/lightSwitchON.png'", TOGGLE.read_text(encoding="utf-8"))

    def test_photoelectric_app_maps_component_events_to_json_commands(self):
        content = PHOTO_APP.read_text(encoding="utf-8")

        self.assertIn("window.remlaCommand", content)
        self.assertIn("commandArguments = []", JSON_APP.read_text(encoding="utf-8"))
        self.assertNotIn("commandName, arguments = []", JSON_APP.read_text(encoding="utf-8"))
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
        self.assertIn("domain: photo1.inst.physics.ucsb.edu", content)
        self.assertIn("index: !path PhotoElectricEffect/zindex.html", content)


if __name__ == "__main__":
    unittest.main()
