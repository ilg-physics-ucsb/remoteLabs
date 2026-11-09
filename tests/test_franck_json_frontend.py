import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "FranckHertz" / "zindex.html"
APP = ROOT / "FranckHertz" / "static" / "js" / "app.js"
VIDEO = ROOT / "static" / "js" / "components" / "video.js"


class FranckJsonFrontendTests(unittest.TestCase):
    def test_page_is_video_only_until_controls_are_reviewed(self):
        content = PAGE.read_text(encoding="utf-8")

        self.assertIn('src="static/js/reader.js"', content)
        self.assertNotIn('src="static/js/remlaJsonSocket.js"', content)
        self.assertNotIn('src="static/js/remlaJsonApp.js"', content)
        self.assertNotIn('src="../static/js/remlaSocket.js"', content)
        self.assertIn('src="static/js/lib.js"', content)
        self.assertIn('href="static/css/app.css"', content)
        self.assertIn('map-html-file="static/svg/ElectrometerMap.html"', content)
        self.assertIn('Device controls are unavailable', content)

    def test_app_does_not_use_stub_socket_or_unsafe_hardware_mapping(self):
        content = APP.read_text(encoding="utf-8")

        self.assertNotIn("WebSocketHandler", content)
        self.assertNotIn("dataChannel", content)
        self.assertNotIn("remla:connection-open", content)
        self.assertNotIn("FHpdu", content)

    def test_shared_video_does_not_use_demo_stream(self):
        content = VIDEO.read_text(encoding="utf-8")

        self.assertIn('new URL("whep", window.location.href)', content)
        self.assertNotIn("mdnplay.dev", content)


if __name__ == "__main__":
    unittest.main()
