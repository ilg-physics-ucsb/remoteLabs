import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "DiffractionInterference" / "index.html"
APP = ROOT / "DiffractionInterference" / "static" / "js" / "main.js"
BRIDGE = ROOT / "static" / "js" / "remlaJsonApp.js"


class DiffractionJsonFrontendTests(unittest.TestCase):
    def test_page_loads_json_client_before_its_app_without_legacy_socket(self):
        page = PAGE.read_text(encoding="utf-8")

        self.assertNotIn('src="static/js/remlaSocket.js"', page)
        self.assertLess(
            page.index('src="static/js/remlaJsonSocket.js"'),
            page.index('src="static/js/remlaJsonApp.js"'),
        )
        self.assertLess(
            page.index('src="static/js/remlaJsonApp.js"'),
            page.index('src="static/js/main.js"'),
        )

    def test_commands_and_handoff_use_the_single_json_bridge(self):
        app = APP.read_text(encoding="utf-8")

        self.assertTrue(BRIDGE.exists())
        self.assertNotIn("dataChannel.send(", app)
        self.assertIn('remlaCommand("Experiment", "handoff"', app)
        self.assertIn('window.addEventListener("remla:state-snapshot"', app)
        self.assertIn('window.addEventListener("remla:ownership-handoff"', app)
        for view in ('view', 'ruler', 'screen'):
            self.assertIn(f'remlaCommand("Camera", "cameraName", ["{view}"])', app)

    def test_startup_does_not_request_a_camera_switch(self):
        app = APP.read_text(encoding="utf-8")

        self.assertNotIn("viewCam.click()", app)

    def test_legacy_device_messages_reach_modals_and_stage_completion_closes_progress(self):
        app = APP.read_text(encoding="utf-8")

        self.assertIn('window.addEventListener("remla:event"', app)
        self.assertIn('controllerResponseHandler(data.message)', app)
        self.assertIn('stageModal.modal("hide")', app)

    def test_queue_status_lives_in_the_existing_page_header(self):
        page = PAGE.read_text(encoding="utf-8")
        app = APP.read_text(encoding="utf-8")

        self.assertIn('id="queue-status"', page[page.index('id="PageHead"'):page.index('id="PageMiddle"')])
        self.assertIn('window.addEventListener("remla:ownership-queue"', app)
        self.assertIn('window.addEventListener("remla:ownership-control"', app)

    def test_power_controls_show_requested_state_before_the_server_replies(self):
        app = APP.read_text(encoding="utf-8")

        power_request = app[app.index('async function requestPowerCommand('):app.index('//for Snapshot')]
        self.assertLess(power_request.index('applyPowerResult(commandName, target)'),
                        power_request.index('await remlaCommand('))
        ambient_request = app[app.index("AmbientTOGGLE.addEventListener('click'"):app.index('//END Ambient Toggling')]
        self.assertLess(ambient_request.index('applyAmbientState(nextState)'),
                        ambient_request.index('await remlaCommand('))


if __name__ == "__main__":
    unittest.main()
