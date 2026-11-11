"""Behavior regressions; only Firefox and Python's standard library are needed.

Run: python -m unittest discover -s tests -p test_photoelectric_json_frontend.py
Browser cases use real custom elements with fake transport/media boundaries.
They never connect to lab hardware or external services.
"""

import functools
import http.server
import json
import queue
import shutil
import subprocess
import tempfile
import threading
import unittest
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PageElements(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.elements = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


class PhotoelectricJsonFrontendTests(unittest.TestCase):
    def test_page_loads_one_json_bridge_and_configures_real_devices(self):
        page = PageElements((ROOT / "PhotoElectricEffect/zindex.html").read_text())
        scripts = [attrs["src"] for tag, attrs in page.elements
                   if tag == "script" and "src" in attrs]
        for name in ("remlaJsonSocket.js", "remlaJsonApp.js", "reader.js"):
            self.assertEqual(scripts.count("static/js/" + name), 1, name)
        self.assertLess(scripts.index("static/js/remlaJsonSocket.js"),
                        scripts.index("static/js/remlaJsonApp.js"))
        self.assertFalse(any("remlaSocket.js" in src or "web-socket-handler" in src
                             for src in scripts))
        for tag, device in (("toggle-component", "HgNeLamp"),
                            ("knob-component", "Pot")):
            self.assertTrue(any(t == tag and a.get("device-name") == device
                                for t, a in page.elements), (tag, device))
        self.assertTrue(any(tag == "knob-component" and attrs.get("device-name") == "Pot"
                            and attrs.get("degrees-per-step") == "1.8"
                            and attrs.get("intervals") == "[3.6, 36, 360]"
                            for tag, attrs in page.elements))

    def run_browser(self, scenario, viewport=None):
        firefox = shutil.which("firefox")
        if not firefox:
            self.skipTest("Firefox is required for real-DOM frontend regressions")
        results = queue.Queue()
        script = """
const reportFetch = window.fetch.bind(window);
const assert = (value, message) => { if (!value) throw Error(message); };
const equal = (actual, expected) => assert(JSON.stringify(actual) === JSON.stringify(expected),
    `expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const eventually = async predicate => {
    for (let i = 0; i < 100; i++) { if (predicate()) return; await new Promise(r => setTimeout(r, 10)); }
    throw Error('Timed out waiting for frontend behavior');
};
try {
""" + scenario + """
    await reportFetch('/__result', {method: 'POST', body: JSON.stringify({ok: true})});
} catch (error) {
    await reportFetch('/__result', {method: 'POST', body: JSON.stringify({ok: false, error: String(error) + '\\n' + error.stack})});
}
"""
        document = ('<!doctype html><body><script type="module">' + script
                    + '</script></body>').encode()

        class Handler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_GET(self):
                if self.path == "/__test":
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(document)
                else:
                    super().do_GET()

            def do_POST(self):
                if self.path != "/__result":
                    self.send_error(404)
                    return
                results.put(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
                self.send_response(204)
                self.end_headers()

        handler = functools.partial(Handler, directory=str(ROOT))
        with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                with tempfile.TemporaryDirectory(prefix="frontend-firefox-") as profile:
                    with subprocess.Popen(
                        [firefox, "--headless", "--no-remote", "--profile", profile,
                         *([f"--width={viewport[0]}", f"--height={viewport[1]}"] if viewport else []),
                         f"http://127.0.0.1:{server.server_port}/__test"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    ) as browser:
                        try:
                            result = results.get(timeout=30)
                        except queue.Empty:
                            self.fail("Firefox returned no test result within 30 seconds")
                        finally:
                            browser.terminate()
                            try:
                                browser.wait(timeout=10)
                            except subprocess.TimeoutExpired:
                                browser.kill()
                                browser.wait()
                        self.assertTrue(result["ok"], result.get("error"))
            finally:
                server.shutdown()
                thread.join()

    def test_json_app_commands_state_events_and_disconnect(self):
        self.run_browser("""
let handlers, connected = 0, rejectPending;
const calls = [];
const pending = new Map([['request', {reject: error => { rejectPending = error; }}]]);
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = pending; }
    connect() { connected++; }
    command(...args) {
        calls.push(args);
        return args[1] === 'fail' ? Promise.reject(Error('denied')) : Promise.resolve({done: true});
    }
};
await import('/static/js/remlaJsonApp.js');
equal(connected, 1);
equal(await window.remlaCommand('Pot', 'move', ['-5']), {done: true});
equal(calls[0], ['Pot', 'move', {arguments: ['-5']}]);
await window.remlaCommand('Experiment', 'handoff', {choice: 'reset'});
equal(calls[1], ['Experiment', 'handoff', {choice: 'reset'}]);
let commandError;
window.addEventListener('remla:command-error', e => commandError = e.detail);
let rejected = false;
try { await window.remlaCommand('Pot', 'fail'); } catch (e) { rejected = e.message === 'denied'; }
assert(rejected && commandError.deviceName === 'Pot', 'failed commands must reject and emit an error');
let changed, handoff;
window.addEventListener('remla:state-changed', e => changed = e.detail);
window.addEventListener('remla:ownership-handoff', e => handoff = e.detail);
handlers.onSnapshot({revision: 1, devices: {HgNeLamp: {power: 'on'}, Ambient: {power: 'off'}}});
handlers.onStateChange({revision: 2, devices: {Ambient: {power: 'on'}}});
equal(window.remlaJsonLatestState.devices, {HgNeLamp: {power: 'on'}, Ambient: {power: 'on'}});
equal(changed.revision, 2);
handlers.onEvent('ownership.handoff', {expiresAt: 123});
equal(handoff, {expiresAt: 123});
equal(window.remlaJsonPendingHandoff, handoff);
handlers.onQueue({position: 1, waitingCount: 2, hasActiveOwner: true});
equal(window.remlaJsonLatestQueue.position, 1);
handlers.onEvent('ownership.control', {hasControl: false});
equal(window.remlaJsonLatestControl.hasControl, false);
handlers.onOpen();
equal(window.remlaJsonConnected, true);
handlers.onClose({code: 1006});
equal(window.remlaJsonConnected, false);
assert(rejectPending instanceof Error, 'disconnect must reject pending commands');
equal(pending.size, 0);
""")

    def test_json_bridge_uses_directory_endpoint_for_explicit_page_url(self):
        for page_path, endpoint_path in (
            ("/", "/ws"),
            ("/index.html", "/ws"),
            ("/photo1/", "/photo1/ws"),
            ("/photo1/index.html?source=test", "/photo1/ws"),
        ):
            with self.subTest(page_path=page_path):
                self.run_browser("""
history.replaceState({}, '', PAGE_PATH);
let endpoint;
window.RemlaJsonSocket = class {
    constructor(options) { endpoint = options.url; this.pending = new Map(); }
    connect() {}
};
await import('/static/js/remlaJsonApp.js');
equal(endpoint, 'ws://' + location.host + ENDPOINT_PATH);
""".replace("PAGE_PATH", json.dumps(page_path)).replace("ENDPOINT_PATH", json.dumps(endpoint_path)))

    def test_diffraction_script_parses_as_classic_browser_javascript(self):
        self.run_browser("""
const response = await reportFetch('/DiffractionInterference/static/js/main.js');
assert(response.ok, 'Diffraction script must be served');
new Function(await response.text());
""")

    def test_diffraction_ambient_presents_requested_and_confirmed_state(self):
        self.run_browser("""
const source = await (await reportFetch('/DiffractionInterference/static/js/main.js')).text();
const ambient = source.slice(source.indexOf('function applyAmbientState('),
    source.indexOf('function applyRemoteState('));
const toggle = {title: ''};
const switchImage = {style: {transform: ''}};
const apply = new Function('AmbientTOGGLE', 'lightSwitch', ambient + '; return applyAmbientState;')(
    toggle, switchImage);
apply(true);
assert(toggle.title.includes('OFF') && switchImage.style.transform.includes('180'),
    'requested ON must immediately look ON');
apply('off');
assert(toggle.title.includes('ON') && switchImage.style.transform.includes('0deg'),
    'confirmed OFF must look OFF');
apply('on');
assert(toggle.title.includes('OFF') && switchImage.style.transform.includes('180'),
    'confirmed ON must look ON');
apply(false);
assert(toggle.title.includes('ON') && switchImage.style.transform.includes('0deg'),
    'rollback to OFF must look OFF');
""")

    def test_photoelectric_state_and_command_completion(self):
        self.run_browser("""
await import('/static/js/components/toggle.js');
await import('/static/js/components/header.js');
const lamp = document.createElement('toggle-component');
lamp.setAttribute('device-name', 'HgNeLamp');
lamp.setAttribute('on-image-url', 'static/imgs/figma-components/hgne-on.png');
lamp.setAttribute('off-image-url', 'static/imgs/figma-components/hgne-off.png');
const header = document.createElement('header-component');
header.setAttribute('data-enable-ambient-light', 'true');
document.body.append(lamp, header);
window.remlaJsonLatestState = {devices: {HgNeLamp: {power: 'on'}, Ambient: {power: 'off'}}};
let finish, fail;
const calls = [];
window.remlaCommand = (...args) => {
    calls.push(args);
    return new Promise((resolve, reject) => { finish = resolve; fail = reject; });
};
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new Event('DOMContentLoaded'));
equal(lamp.enabled, true);
lamp.shadowRoot.querySelector('img').click();
equal(calls, [['HgNeLamp', 'power_off', []]]);
equal(lamp.enabled, true); // The confirmed state remains unchanged until a server update.
assert(lamp.pending, 'show immediate feedback while the command runs');
assert(lamp.shadowRoot.querySelector('img').src.includes('hgne-off.png'), 'show requested state immediately');
lamp.shadowRoot.querySelector('img').click();
equal(calls.length, 1); // A command in flight must not be duplicated.
fail(Error('not owner'));
await tick();
equal(lamp.pending, false);
equal(lamp.enabled, true);
assert(lamp.shadowRoot.querySelector('img').src.includes('hgne-on.png'), 'restore confirmed state on failure');
window.dispatchEvent(new CustomEvent('remla:state-changed', {detail: {devices: {HgNeLamp: {power: 'off'}}}}));
equal(lamp.enabled, false);
lamp.shadowRoot.querySelector('img').click();
equal(calls[1], ['HgNeLamp', 'power_on', []]);
finish({});
await tick();
equal(lamp.pending, false);
window.dispatchEvent(new CustomEvent('remla:state-snapshot', {detail: {devices: {Ambient: {power: 'on'}}}}));
const ambient = header.shadowRoot.querySelector('toggle-component');
equal(ambient.enabled, true);
ambient.shadowRoot.querySelector('img').click();
equal(calls[2], ['Ambient', 'power_off', []]);
finish({});
""")

    def test_photoelectric_handoff_replays_pending_and_prevents_duplicate_prompt(self):
        self.run_browser("""
let prompts = 0, finish;
const calls = [];
window.confirm = () => { prompts++; return prompts === 1; };
window.remlaCommand = (...args) => { calls.push(args); return new Promise(r => finish = r); };
window.remlaJsonPendingHandoff = {expiresAt: 123};
await import('/PhotoElectricEffect/static/js/app.js');
equal(prompts, 1);
equal(calls[0], ['Experiment', 'handoff', {choice: 'continue'}]);
equal(window.remlaJsonPendingHandoff, null);
window.dispatchEvent(new CustomEvent('remla:ownership-handoff', {detail: {}}));
equal(prompts, 1);
finish({});
await tick();
window.dispatchEvent(new CustomEvent('remla:ownership-handoff', {detail: {}}));
equal(prompts, 2);
equal(calls[1], ['Experiment', 'handoff', {choice: 'reset'}]);
finish({});
""")

    def test_queue_and_control_events_render_inside_existing_header(self):
        self.run_browser("""
await import('/static/js/components/toggle.js');
await import('/static/js/components/header.js');
const header = document.createElement('header-component');
document.body.append(header);
const queue = header.shadowRoot.querySelector('.queue-status');
assert(queue, 'queue status belongs in the existing header');
window.dispatchEvent(new CustomEvent('remla:ownership-queue', {
    detail: {position: 2, waitingCount: 3, hasActiveOwner: true}
}));
assert(queue.textContent.includes('2'), 'show the recipient queue position');
window.dispatchEvent(new CustomEvent('remla:ownership-control', {
    detail: {hasControl: true, handoffRequired: false, lifecycle: 'ready'}
}));
window.dispatchEvent(new CustomEvent('remla:ownership-queue', {
    detail: {position: null, waitingCount: 1, hasActiveOwner: true}
}));
assert(queue.textContent.includes('1'), 'owner should see how many are waiting');
window.dispatchEvent(new CustomEvent('remla:connection-closed', {detail: {}}));
assert(queue.textContent.toLowerCase().includes('disconnect'), 'do not show stale queue after disconnect');
header.remove();
window.dispatchEvent(new CustomEvent('remla:ownership-queue', {
    detail: {position: 1, waitingCount: 1, hasActiveOwner: true}
}));
assert(queue.textContent.toLowerCase().includes('disconnect'), 'detached header must stop listening');
""")

    def test_header_replays_queue_received_before_it_connected(self):
        self.run_browser("""
await import('/static/js/components/toggle.js');
await import('/static/js/components/header.js');
window.remlaJsonLatestQueue = {position: 1, waitingCount: 3, hasActiveOwner: true};
window.remlaJsonLatestControl = {hasControl: false};
const header = document.createElement('header-component');
document.body.append(header);
assert(header.shadowRoot.querySelector('.queue-status').textContent.includes('1'),
    'render early queue notification when header connects');
""")

    def test_video_and_tool_detail_share_desktop_row(self):
        self.run_browser("""
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => {
    stylesheet.onload = resolve;
    stylesheet.onerror = reject;
});
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/video.js');
await import('/static/js/components/resizer.js');
await import('/static/js/components/tool-detail.js');
const row = document.createElement('div');
row.className = 'video-row';
const headerSpace = document.createElement('div');
headerSpace.style.height = '160px';
document.body.append(headerSpace);
row.innerHTML = '<video-component data-views="[]"></video-component>' +
    '<resizer-component allow-resize="true"></resizer-component><tool-detail-component></tool-detail-component>';
document.body.append(row);
const toolbarSpace = document.createElement('div');
toolbarSpace.style.height = '75px';
document.body.append(toolbarSpace);
const video = row.querySelector('video-component');
const media = video.shadowRoot.querySelector('video');
media.style.width = '1500px'; // Mimic a high-resolution stream's large intrinsic content.
const detail = row.querySelector('tool-detail-component');
const rowBounds = row.getBoundingClientRect();
const videoBounds = video.getBoundingClientRect();
const detailBounds = detail.getBoundingClientRect();
assert(window.innerWidth >= 768, 'fixture must exercise desktop layout');
assert(detailBounds.width >= rowBounds.width * 0.25,
    `tool detail must have usable width beside video: ${JSON.stringify({row: rowBounds.width, video: videoBounds.width, detail: detailBounds.width})}`);
assert(videoBounds.width <= rowBounds.width * 0.75, 'video must not consume the entire row');
assert(videoBounds.right <= detailBounds.left, 'tool detail must be beside, not underneath, video');
assert(detailBounds.right <= window.innerWidth, 'tool detail must not overflow the viewport');
const handle = row.querySelector('resizer-component').shadowRoot.querySelector('.handle');
const handleBounds = handle.getBoundingClientRect();
handle.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, clientX: handleBounds.left + 2}));
window.dispatchEvent(new MouseEvent('mousemove', {clientX: rowBounds.left + rowBounds.width * 0.5}));
window.dispatchEvent(new MouseEvent('mouseup'));
assert(video.getBoundingClientRect().width < videoBounds.width - 40,
    'dragging the resizer must change the video width');
assert(detail.getBoundingClientRect().width > detailBounds.width + 40,
    'tool detail must gain the space released by video resizing');
row.remove();
""")

    def test_photoelectric_wheels_fit_panel_and_keep_clickable_hotspots(self):
        scenario = """
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/video.js');
await import('/static/js/components/resizer.js');
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/imgMapDevice.js');
const source = new DOMParser().parseFromString(
    await (await reportFetch('/PhotoElectricEffect/zindex.html')).text(), 'text/html');
const row = document.createElement('div');
row.className = 'video-row';
row.style.height = innerWidth < 768 ? 'auto' : '440px';
const tools = ['filter-wheel', 'density-wheel'].map(id => source.querySelector('#' + id).outerHTML);
row.innerHTML = '<video-component data-views="[]"></video-component>' +
    '<resizer-component allow-resize="true"></resizer-component>' +
    '<tool-detail-component class="' + source.querySelector('tool-detail-component').className + '">' +
    tools.join('') + '</tool-detail-component>';
document.body.innerHTML = '<div style="height:130px"></div>';
document.body.append(row);
document.body.insertAdjacentHTML('beforeend', '<div style="height:75px"></div>');
const detail = row.querySelector('tool-detail-component');
if (innerWidth < 768) {
    row.querySelector('video-component').style.height = '220px';
}
const commands = [];
window.addEventListener('remla-command', event => commands.push(event.detail));
async function checkWheel(id, hotspot, expectedDevice, expectedArgument) {
    window.dispatchEvent(new CustomEvent('toolbarSelection', {detail: {toolGroupId: id}}));
    const tool = row.querySelector('#' + id);
    const panel = tool.querySelector('.tool-interface');
    const map = tool.querySelector('img-map-device');
    await eventually(() => map.shadowRoot.querySelector('svg'));
    map.scrollIntoView({block: 'center'});
    const svg = map.shadowRoot.querySelector('svg');
    const bounds = svg.getBoundingClientRect();
    const available = panel.getBoundingClientRect();
    assert(available.height >= 120,
        `fixture must have a usable panel height: ${JSON.stringify({viewport: innerWidth, row: row.getBoundingClientRect().height, detail: detail.getBoundingClientRect().height, tool: tool.getBoundingClientRect().height, panel: available.height})}`);
    assert(bounds.width >= 100 && bounds.height >= 100, 'wheel must remain visible');
    assert(bounds.left >= available.left - 2 && bounds.right <= available.right + 2 &&
        bounds.top >= available.top - 2 && bounds.bottom <= available.bottom + 2,
        `wheel must fit panel at ${innerWidth}px: ${JSON.stringify({wheel: [bounds.width,bounds.height,bounds.top,bounds.bottom],panel: [available.width,available.height,available.top,available.bottom]})}`);
    assert(Math.abs(bounds.width / bounds.height - 622 / 685) < 0.02, 'preserve wheel aspect ratio');
    const circle = svg.querySelector('#' + hotspot);
    const hit = circle.getBoundingClientRect();
    const x = hit.left + hit.width / 2, y = hit.top + hit.height / 2;
    assert(map.shadowRoot.elementFromPoint(x, y) === circle,
        'wheel hotspot must be hit-testable after scaling');
    circle.dispatchEvent(new MouseEvent('click', {bubbles: true, clientX: x, clientY: y}));
    equal(commands.at(-1).deviceName, expectedDevice);
    equal(commands.at(-1).arguments, [expectedArgument]);
    map.setPending(false);
}
await checkWheel('filter-wheel', 'f365', 'colorWheel', '0deg');
await checkWheel('density-wheel', 'nd03', 'densityWheel', '300deg');
if (innerWidth >= 768) {
    const video = row.querySelector('video-component');
    const before = video.getBoundingClientRect().width;
    const handle = row.querySelector('resizer-component').shadowRoot.querySelector('.handle');
    const box = handle.getBoundingClientRect();
    handle.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, clientX: box.left + 2}));
    window.dispatchEvent(new MouseEvent('mousemove', {clientX: row.getBoundingClientRect().left + row.clientWidth * .48}));
    window.dispatchEvent(new MouseEvent('mouseup'));
    assert(Math.abs(video.getBoundingClientRect().width - before) > 30, 'fixture must resize the live row');
    await checkWheel('filter-wheel', 'f365', 'colorWheel', '0deg');
    await checkWheel('density-wheel', 'nd03', 'densityWheel', '300deg');
}
"""
        for viewport in ((1200, 800), (650, 800), (375, 667)):
            with self.subTest(viewport=viewport):
                self.run_browser(scenario, viewport=viewport)

    def test_selected_tools_and_instrument_maps_fill_without_overflow(self):
        for page, ids in (
            ('PhotoElectricEffect/zindex.html', ['mercury-neon-lamp', 'electrometer', 'filter-wheel', 'potentiometer']),
            ('FranckHertz/zindex.html', ['electrometer', 'variac']),
        ):
            for viewport in ((1200, 800), (375, 667)):
                with self.subTest(page=page, viewport=viewport):
                    self.run_browser('const page = ' + json.dumps(page) + '; const ids = ' +
                                     json.dumps(ids) + ';\n' + """
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/video.js');
await import('/static/js/components/resizer.js');
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/imgMapDevice.js');
await import('/static/js/components/knob.js');
await import('/static/js/components/toggle.js');
const source = new DOMParser().parseFromString(
    await (await reportFetch('/' + page)).text(), 'text/html');
const row = document.createElement('div');
row.className = 'video-row';
row.style.height = innerWidth < 768 ? 'auto' : '320px';
row.innerHTML = '<video-component data-views="[]"></video-component>' +
    '<resizer-component allow-resize="true"></resizer-component>' +
    source.querySelector('tool-detail-component').outerHTML;
document.body.append(row);
const detail = row.querySelector('tool-detail-component');
if (innerWidth < 768) {
    row.style.width = '343px';
    row.querySelector('video-component').style.height = '220px';
    detail.style.height = '380px';
}
        for (const id of ids) {
    window.dispatchEvent(new CustomEvent('toolbarSelection', {detail: {toolGroupId: id}}));
    const tool = detail.querySelector('#' + id);
    const heading = tool.querySelector('.tool-heading');
    const panel = tool.querySelector('.tool-interface');
    const outer = detail.getBoundingClientRect();
    const bounds = tool.getBoundingClientRect();
    const head = heading.getBoundingClientRect();
    const body = panel.getBoundingClientRect();
    assert(bounds.height >= outer.height - 2, `selected ${id} must fill detail: ${bounds.height}/${outer.height}`);
    for (const [name, rect] of [['tool', bounds], ['heading', head], ['interface', body]]) {
        assert(rect.left >= outer.left - 2 && rect.right <= outer.right + 2 &&
            rect.top >= outer.top - 2 && rect.bottom <= outer.bottom + 2,
            `${page} ${id} ${name} escaped detail: ${JSON.stringify({outer: [outer.width, outer.height], rect: [rect.width, rect.height, rect.top, rect.bottom]})}`);
    }
    const map = panel.querySelector('img-map-device');
    if (map) {
        await eventually(() => map.shadowRoot.querySelector('svg'));
        const svg = map.shadowRoot.querySelector('svg').getBoundingClientRect();
        assert(svg.width > 0 && svg.height > 0, 'instrument map must remain visible');
        assert(svg.left >= body.left - 2 && svg.right <= body.right + 2 &&
            svg.top >= body.top - 2 && svg.bottom <= body.bottom + 2,
            `${page} ${id} SVG escaped its panel: ${JSON.stringify({svg: [svg.width, svg.height], panel: [body.width, body.height]})}`);
    }
    if (heading.scrollHeight > heading.clientHeight + 2) {
        assert(getComputedStyle(heading).overflowY === 'auto', 'long headings must remain scrollable');
    }
    const description = heading.querySelector('.tool-description');
    if (description) {
        assert(description.getBoundingClientRect().height > 0, `${page} ${id} description collapsed`);
    }
    const knob = panel.querySelector('knob-component');
    if (knob) {
        const select = knob.shadowRoot.querySelector('select').getBoundingClientRect();
        assert(select.height > 0 && select.top >= body.top - 2 && select.bottom <= body.bottom + 2,
            `${page} ${id} knob step selector must be reachable inside panel: ${JSON.stringify({select: [select.top, select.bottom], panel: [body.top, body.bottom]})}`);
    }
}
""", viewport=viewport)

    def test_switches_and_knobs_fit_control_space_at_both_sizes(self):
        for page, ids in (
            ('PhotoElectricEffect/zindex.html', ['mercury-neon-lamp', 'potentiometer']),
            ('FranckHertz/zindex.html', ['variac', 'accelerating-voltage']),
        ):
            with self.subTest(page=page):
                self.run_browser('const page = ' + json.dumps(page) + '; const ids = ' +
                                 json.dumps(ids) + ';\n' + """
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/knob.js');
await import('/static/js/components/toggle.js');
const source = new DOMParser().parseFromString(
    await (await reportFetch('/' + page)).text(), 'text/html');
const detail = source.querySelector('tool-detail-component');
for (const component of detail.querySelectorAll('toggle-component, knob-component')) {
    for (const attr of ['on-image-url', 'off-image-url', 'knob-image-url']) {
        if ((page.startsWith('FranckHertz/') || (page.startsWith('PhotoElectricEffect/') && attr === 'knob-image-url')) &&
                component.hasAttribute(attr) && component.getAttribute(attr)) {
            component.setAttribute(attr, '/' + page.split('/')[0] + '/' + component.getAttribute(attr));
        }
    }
}
detail.style.display = 'block';
document.body.append(detail);
const within = (inner, outer, label) => assert(
    inner.width > 0 && inner.height > 0 && inner.left >= outer.left - 2 &&
    inner.right <= outer.right + 2 && inner.top >= outer.top - 2 && inner.bottom <= outer.bottom + 2,
    `${page} ${label} escaped: ${JSON.stringify({inner: [inner.x, inner.y, inner.width, inner.height], outer: [outer.x, outer.y, outer.width, outer.height]})}`);
const measures = {};
for (const [width, height] of [[460, 560], [290, 440], [150, 780]]) {
    detail.style.width = width + 'px';
    detail.style.height = height + 'px';
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const id of ids) {
        window.dispatchEvent(new CustomEvent('toolbarSelection', {detail: {toolGroupId: id}}));
        const panel = detail.querySelector('#' + id + ' .tool-interface');
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const area = panel.getBoundingClientRect();
        for (const instruction of panel.querySelectorAll('p')) {
            within(instruction.getBoundingClientRect(), area, `${id} instruction`);
        }
        for (const toggle of panel.querySelectorAll('toggle-component')) {
            const available = toggle.getBoundingClientRect();
            const image = toggle.shadowRoot.querySelector('img');
            await eventually(() => image.complete && image.naturalWidth > 0 &&
                toggle.style.getPropertyValue('--toggle-ratio'));
            const rect = image.getBoundingClientRect();
            within(available, area, `${id} toggle area`);
            within(rect, available, `${id} switch hit target`);
            assert(toggle.shadowRoot.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === image,
                `${id} switch center must be clickable`);
            const scale = Math.min(available.width / image.naturalWidth, available.height / image.naturalHeight);
            assert(Math.abs(rect.width - image.naturalWidth * scale) < 3 &&
                Math.abs(rect.height - image.naturalHeight * scale) < 3,
                `${id} switch should fit its area uniformly: ${JSON.stringify({rect: [rect.width, rect.height], available: [available.width, available.height], natural: [image.naturalWidth, image.naturalHeight]})}`);
            measures[`${id}-switch-${width}`] = rect.width * rect.height;
        }
        for (const knob of panel.querySelectorAll('knob-component')) {
            const available = knob.getBoundingClientRect();
            const row = knob.shadowRoot.querySelector('.row').getBoundingClientRect();
            const select = knob.shadowRoot.querySelector('select').getBoundingClientRect();
            const image = knob.shadowRoot.querySelector('img');
            await eventually(() => image.complete && image.naturalWidth > 0);
            within(available, area, `${id} knob area`);
            within(row, available, `${id} knob controls`);
            within(select, available, `${id} step selector`);
            const scale = Math.min(available.width / 160, (available.height - select.height - 8) / 97);
            assert(Math.abs(row.width - 160 * scale) < 12 && Math.abs(row.height - 97 * scale) < 8 &&
                Math.abs(row.width / row.height - 160 / 97) < 0.02,
                `${id} knob should fill its remaining area uniformly: ${JSON.stringify({row: [row.width, row.height], available: [available.width, available.height], select: select.height})}`);
            for (const part of knob.shadowRoot.querySelectorAll('.row > *')) {
                const target = part.getBoundingClientRect();
                within(target, row, `${id} knob hit target`);
                const hit = knob.shadowRoot.elementFromPoint(target.x + target.width / 2, target.y + target.height / 2);
                assert(part === hit || part.contains(hit), `${id} knob target must remain clickable`);
            }
            measures[`${id}-knob-${width}`] = row.width * row.height;
        }
    }
}
for (const id of ids) {
    for (const kind of ['switch', 'knob']) {
        const large = measures[`${id}-${kind}-460`];
        if (large) for (const smaller of [290, 150]) {
            assert(large > measures[`${id}-${kind}-${smaller}`] * 1.25,
                `${id} ${kind} should grow with available space`);
        }
    }
}
const switchElement = detail.querySelector('toggle-component');
const events = [];
window.addEventListener('toggle', event => events.push(event.detail));
switchElement.shadowRoot.querySelector('img').click();
equal(events.length, 1);
const knobElement = detail.querySelector('knob-component');
const step = knobElement.shadowRoot.querySelector('select');
step.value = step.options[1].value;
step.dispatchEvent(new Event('change'));
window.addEventListener('knob', event => events.push(event.detail));
knobElement.shadowRoot.querySelector('#up').dispatchEvent(new MouseEvent('click', {bubbles: true}));
equal(events.length, 2);
""")

    def test_landscape_tablet_keeps_all_controls_visible_without_scrolling(self):
        for page, ids in (
            ('PhotoElectricEffect/zindex.html', ['mercury-neon-lamp', 'potentiometer', 'electrometer', 'filter-wheel']),
            ('FranckHertz/zindex.html', ['variac', 'accelerating-voltage', 'filament', 'electrometer']),
        ):
            for viewport in ((1024, 768), (1200, 800)):
                with self.subTest(page=page, viewport=viewport):
                    self.run_browser('const page = ' + json.dumps(page) + '; const ids = ' +
                                     json.dumps(ids) + ';\n' + """
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/header.js');
await import('/static/js/components/video.js');
await import('/static/js/components/resizer.js');
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/imgMapDevice.js');
await import('/static/js/components/knob.js');
await import('/static/js/components/toggle.js');
await import('/static/js/components/toolbar.js');
const source = new DOMParser().parseFromString(
    await (await reportFetch('/' + page)).text(), 'text/html');
if (page.startsWith('FranckHertz/') || page.startsWith('PhotoElectricEffect/')) {
    for (const element of source.querySelectorAll('[off-image-url], [on-image-url], [knob-image-url], [map-html-file]')) {
        for (const attr of ['off-image-url', 'on-image-url', 'knob-image-url', 'map-html-file']) {
            if (element.getAttribute(attr) && (page.startsWith('FranckHertz/') || attr === 'knob-image-url')) {
                element.setAttribute(attr, '/' + page.split('/')[0] + '/' + element.getAttribute(attr));
            }
        }
    }
}
document.body.innerHTML = source.body.innerHTML;
const row = document.querySelector('.video-row');
const video = row.querySelector('video-component');
const detail = row.querySelector('tool-detail-component');
const handle = row.querySelector('resizer-component').shadowRoot.querySelector('.handle');
const outer = row.getBoundingClientRect();
handle.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, clientX: handle.getBoundingClientRect().left + 2}));
window.dispatchEvent(new MouseEvent('mousemove', {clientX: outer.right - 10}));
window.dispatchEvent(new MouseEvent('mouseup'));
for (const id of ids) {
    window.dispatchEvent(new CustomEvent('toolbarSelection', {detail: {toolGroupId: id}}));
    const tool = detail.querySelector('#' + id);
    const heading = tool.querySelector('.tool-heading');
    const panel = tool.querySelector('.tool-interface');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const bounds = panel.getBoundingClientRect();
    assert(detail.getBoundingClientRect().width >= 350,
        `resizer must preserve tablet tool width: ${JSON.stringify({viewport: [innerWidth, innerHeight], row: [outer.width, outer.height], detail: detail.getBoundingClientRect().width, minWidth: getComputedStyle(detail).minWidth, video: video.getBoundingClientRect().width})}`);
    assert(panel.scrollHeight <= panel.clientHeight + 2 && getComputedStyle(panel).overflowY !== 'auto',
        `${page} ${id} controls must not scroll: ${JSON.stringify({panel: [panel.clientWidth, panel.clientHeight, panel.scrollHeight], detail: [detail.clientWidth, detail.clientHeight], video: video.clientWidth})}`);
    for (const instruction of panel.querySelectorAll('p')) {
        const rect = instruction.getBoundingClientRect();
        assert(rect.top >= bounds.top - 2 && rect.bottom <= bounds.bottom + 2,
            `${id} instruction must stay visible`);
    }
    for (const selector of panel.querySelectorAll('knob-component')) {
        const select = selector.shadowRoot.querySelector('select').getBoundingClientRect();
        const arrows = selector.shadowRoot.querySelector('.row').getBoundingClientRect();
        const image = selector.shadowRoot.querySelector('img');
        await eventually(() => image.complete && image.naturalWidth > 0);
        assert(arrows.height >= 30 && select.top >= bounds.top - 2 && arrows.bottom <= bounds.bottom + 2,
            `${id} knob must remain usable`);
    }
    assert(heading.getBoundingClientRect().height > 0, 'description area remains available');
}
assert(document.documentElement.scrollWidth <= innerWidth + 2 &&
    document.documentElement.scrollHeight <= innerHeight + 2,
    `tablet page must fit viewport: ${JSON.stringify({page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], viewport: [innerWidth, innerHeight]})}`);
""", viewport=viewport)

    def test_full_mobile_pages_keep_toolbar_below_tool_detail(self):
        for page in ('PhotoElectricEffect/zindex.html', 'FranckHertz/zindex.html'):
            with self.subTest(page=page):
                self.run_browser('const page = ' + json.dumps(page) + ';\n' + """
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
window.MediaMTXWebRTCReader = class { close() {} };
const source = new DOMParser().parseFromString(
    await (await reportFetch('/' + page)).text(), 'text/html');
document.body.innerHTML = source.body.innerHTML;
await import('/static/js/components/toggle.js');
await import('/static/js/components/header.js');
await import('/static/js/components/video.js');
await import('/static/js/components/resizer.js');
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/toolbar.js');
assert(innerWidth < 768, `expected mobile breakpoint; got ${innerWidth}px`);
const row = document.querySelector('.video-row');
const detail = row.querySelector('tool-detail-component');
const toolbar = document.querySelector('toolbar-component');
window.dispatchEvent(new CustomEvent('toolbarSelection', {detail: {
    toolGroupId: page.startsWith('FranckHertz') ? 'variac' : 'filter-wheel'
}}));
const rowBounds = row.getBoundingClientRect();
const detailBounds = detail.getBoundingClientRect();
const toolbarBounds = toolbar.getBoundingClientRect();
assert(detailBounds.height >= 380, 'detail needs its usable mobile height');
assert(rowBounds.bottom >= detailBounds.bottom - 2,
    `detail must remain inside the mobile row: ${JSON.stringify({row: rowBounds.bottom, detail: detailBounds.bottom})}`);
assert(toolbarBounds.top >= detailBounds.bottom - 2,
    `toolbar must follow, not cover, detail: ${JSON.stringify({toolbar: toolbarBounds.top, detail: detailBounds.bottom})}`);
""", viewport=(375, 667))

    def test_knob_and_image_map_emit_structured_commands(self):
        self.run_browser("""
await import('/static/js/components/knob.js');
await import('/static/js/components/imgMapDevice.js');
const commands = [];
window.addEventListener('remla-command', e => commands.push(e.detail));
const knob = document.createElement('knob-component');
knob.setAttribute('device-name', 'Pot');
knob.setAttribute('command-name', 'move');
knob.setAttribute('intervals', '[5,10]');
document.body.append(knob);
knob.shadowRoot.querySelector('#up').dispatchEvent(new MouseEvent('click', {bubbles: true}));
equal(commands.length, 0);
const select = knob.shadowRoot.querySelector('select');
select.value = '5';
select.dispatchEvent(new Event('change'));
knob.shadowRoot.querySelector('#down').dispatchEvent(new MouseEvent('click', {bubbles: true}));
equal(commands.length, 1);
equal(commands[0].deviceName, 'Pot');
equal(commands[0].commandName, 'move');
equal(commands[0].arguments, ['-5']);
window.fetch = async () => ({ok: true, text: async () => '<svg><g data-cmd="press/SYST:KEY 1"><path id="key"/></g></svg>'});
const map = document.createElement('img-map-device');
map.setAttribute('device-name', 'Electrometer');
map.setAttribute('map-html-file', '/fixture.svg');
map.setAttribute('lock-while-commanding', '');
document.body.append(map);
await eventually(() => map.shadowRoot.querySelector('#key'));
map.shadowRoot.querySelector('#key').dispatchEvent(new MouseEvent('click', {bubbles: true}));
equal(commands[1].deviceName, 'Electrometer');
equal(commands[1].commandName, 'press');
equal(commands[1].arguments, ['SYST:KEY 1']);
assert(commands[1].source === map, 'bridge needs the source to clear pending state');
assert(map.hasAttribute('data-command-pending'), 'map must lock while command is pending');
map.setPending(false);
assert(!map.hasAttribute('data-command-pending'), 'map must unlock on completion');
""")

    def test_photoelectric_instrument_power_uses_routed_command(self):
        self.run_browser("""
await import('/static/js/components/imgMapDevice.js');
const commands = [];
window.addEventListener('remla-command', event => commands.push(event.detail));
for (const [device, powerId, keyId, filename] of [
    ['Electrometer', 'Power6514', 'Voltage', 'ElectrometerMap'],
    ['Multimeter', 'Power2000', 'DCVoltage', 'MultimeterMap'],
]) {
    const map = document.createElement('img-map-device');
    map.setAttribute('device-name', device);
    map.setAttribute('map-html-file', '/static/svg/' + filename + '.html');
    map.setAttribute('lock-while-commanding', '');
    document.body.append(map);
    await eventually(() => map.shadowRoot.querySelector('#' + powerId));
    map.shadowRoot.querySelector('#' + powerId).dispatchEvent(new MouseEvent('click', {bubbles: true}));
    equal(commands.at(-1).deviceName, device);
    equal(commands.at(-1).commandName, 'power_toggle');
    equal(commands.at(-1).arguments, []);
    assert(map.hasAttribute('data-command-pending'), 'Power must lock the map until completion');
    const count = commands.length;
    map.shadowRoot.querySelector('#' + powerId).dispatchEvent(new MouseEvent('click', {bubbles: true}));
    equal(commands.length, count);
    map.setPending(false);
    map.shadowRoot.querySelector('#' + keyId).dispatchEvent(new MouseEvent('click', {bubbles: true}));
    equal(commands.at(-1).commandName, 'press');
    equal(commands.at(-1).arguments, ['SYST:KEY 2']);
    map.remove();
}
""")

    def test_photoelectric_potentiometer_degrees_send_integer_motor_steps(self):
        self.run_browser("""
await import('/static/js/components/knob.js');
const commands = [];
window.addEventListener('remla-command', event => commands.push(event.detail));
const knob = document.createElement('knob-component');
knob.setAttribute('device-name', 'Pot');
knob.setAttribute('command-name', 'move');
knob.setAttribute('intervals', '[3.6,36,360]');
knob.setAttribute('degrees-per-step', '1.8');
document.body.append(knob);
const select = knob.shadowRoot.querySelector('select');
for (const [degrees, expected] of [['3.6', '2'], ['36', '20'], ['360', '200']]) {
    select.value = degrees;
    select.dispatchEvent(new Event('change'));
    knob.shadowRoot.querySelector('#up').dispatchEvent(new MouseEvent('click', {bubbles: true}));
    equal(commands.at(-1).arguments, [expected]);
    knob.setPending(false);
    knob.shadowRoot.querySelector('#down').dispatchEvent(new MouseEvent('click', {bubbles: true}));
    equal(commands.at(-1).arguments, ['-' + expected]);
    knob.setPending(false);
}
""")

    def test_whep_tracks_disconnect_reconnect_and_stale_callbacks(self):
        self.run_browser("""
const readers = [];
window.MediaMTXWebRTCReader = class {
    constructor(options) { this.options = options; this.closed = 0; readers.push(this); }
    close() { this.closed++; }
};
history.replaceState({}, '', '/photo1/?test=preserved');
await import('/static/js/components/video.js');
const component = document.createElement('video-component');
component.dataset.views = '[]';
document.body.append(component);
equal(readers.length, 1);
const url = new URL(readers[0].options.url);
equal(url.origin, location.origin);
equal(url.pathname, '/photo1/whep');
equal(url.searchParams.get('test'), 'preserved');
assert(url.searchParams.has('remla_reload'), 'reconnect URL must bypass stale sessions');
const video = component.shadowRoot.querySelector('video');
assert(['autoplay', 'muted', 'playsinline'].every(name => video.hasAttribute(name)),
    'live feed must support inline autoplay');
assert(!video.hasAttribute('src'), 'do not load the demonstration video');
const stream = new MediaStream();
readers[0].options.onTrack({streams: [stream]});
assert(video.srcObject === stream, 'attach the received stream');
component.remove();
equal(readers[0].closed, 1);
equal(video.srcObject, null);
document.body.append(component);
equal(readers.length, 2);
const active = new MediaStream();
readers[1].options.onTrack({streams: [active]});
readers[0].options.onTrack({streams: [stream]});
readers[0].options.onError('obsolete failure');
assert(video.srcObject === active, 'stale callbacks must not replace the current stream');
assert(!component.shadowRoot.textContent.includes('obsolete failure'), 'ignore stale reader errors');
readers[1].options.onError('feed unavailable');
assert(component.shadowRoot.textContent.includes('feed unavailable'), 'show active reader errors');
component.remove();
equal(readers[1].closed, 1);
""")


if __name__ == "__main__":
    unittest.main()
