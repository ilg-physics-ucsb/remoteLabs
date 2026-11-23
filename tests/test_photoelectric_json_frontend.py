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
    def test_unapproved_power_routes_cannot_send_hardware_commands(self):
        page = PageElements((ROOT / "PhotoElectricEffect/zindex.html").read_text())
        self.assertNotIn("data-routed-power", next(attrs for tag, attrs in page.elements if tag == "body"))
        self.run_browser("""
const calls = [];
window.RemlaJsonSocket = class {
    constructor() {}
    connect() {}
    command(...args) { calls.push(args); return Promise.resolve({ok: true}); }
};
await import('/static/js/remlaJsonApp.js');
for (const name of ['HgNeLamp', 'Ambient', 'Laser', 'Screen', 'Electrometer', 'Multimeter']) {
    try {
        await window.remlaCommand(name, 'power_on', []);
        throw Error('unsupported power command was accepted');
    } catch (error) {
        assert(String(error).includes('not enabled'), String(error));
    }
}
equal(calls, []);
document.body.setAttribute('data-routed-power', '');
await window.remlaCommand('HgNeLamp', 'power_on', []);
equal(calls.length, 1);
""", routed_power=False)

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

    def run_browser(self, scenario, viewport=None, routed_power=True):
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
        document = ('<!doctype html><body' + (' data-routed-power' if routed_power else '')
                    + '><script type="module">' + script
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

    def test_ui_state_bridge_and_photoelectric_follow_is_read_only_for_waiters(self):
        self.run_browser("""
await import('/static/js/components/toggle.js');
await import('/static/js/components/header.js');
await import('/static/js/components/alert-dialog.js');
await import('/static/js/components/toolbar.js');
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/knob.js');
const header = document.createElement('header-component');
const toolbar = document.createElement('toolbar-component');
toolbar.innerHTML = `<ul><li><button group-id="potentiometer">Pot</button></li>
    <li><button group-id="filter-wheel">Filter</button></li></ul>`;
const detail = document.createElement('tool-detail-component');
detail.innerHTML = `<div id="potentiometer"><div class="tool-interface"><knob-component
    device-name="Pot" command-name="move" degrees-per-step="1.8" intervals="[3.6,36,360]"
    ></knob-component></div></div><div id="filter-wheel"><div class="tool-interface"></div></div>`;
const dialog = document.createElement('alert-dialog');
const lamp = document.createElement('toggle-component');
lamp.setAttribute('device-name', 'HgNeLamp');
document.body.append(header, detail, toolbar, dialog, lamp);
let handlers;
const calls = [];
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = new Map(); }
    connect() {}
    command(...args) { calls.push(args); return Promise.resolve({ok: true}); }
};
await import('/static/js/remlaJsonApp.js');
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new Event('DOMContentLoaded'));
handlers.onEvent('ownership.control', {hasControl: true, handoffRequired: false, lifecycle: 'ready'});
const pot = detail.querySelector('knob-component');
toolbar.querySelector('[group-id="potentiometer"]').click();
const interval = pot.shadowRoot.querySelector('select');
interval.value = '36';
interval.dispatchEvent(new Event('change'));
await eventually(() => calls.some(call => call[1] === 'set_ui_state'));
assert(calls.every(call => call[0] === 'Experiment'), 'presentation updates must not move hardware');
assert(calls.some(call => call[2]?.namespace === 'photoelectric'
    && call[2].values?.selectedTool === 'potentiometer'
    && call[2].values?.potInterval === '36'), 'owner publishes current UI state');
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: false, lifecycle: 'ready'});
handlers.onQueue({position: 1, waitingCount: 1, hasActiveOwner: true});
const follow = header.shadowRoot.querySelector('input[name="follow-controller"]');
assert(follow && !follow.hidden && follow.checked, 'queued viewer can opt out of following');
dialog.shadowRoot.querySelector('#close').click();
const before = calls.length;
handlers.onEvent('ui.state.snapshot', {revision: 2, namespaces: {photoelectric: {
    selectedTool: 'filter-wheel', potInterval: '360'
}}});
equal(window.remlaJsonLatestUiState.revision, 2);
equal(lamp.enabled, false);
handlers.onSnapshot({revision: 1, devices: {HgNeLamp: {power: 'on'}, Ambient: {power: 'off'}}});
equal(lamp.enabled, true);
equal(header.shadowRoot.querySelector('toggle-component').enabled, false);
handlers.onStateChange({revision: 2, devices: {Ambient: {power: 'on'}}});
equal(header.shadowRoot.querySelector('toggle-component').enabled, true);
equal(toolbar.querySelector('[group-id="filter-wheel"]').classList.contains('active'), true);
equal(interval.value, '360');
equal(calls.length, before); // Mirroring must never echo a command.
follow.click();
toolbar.querySelector('[group-id="potentiometer"]').click();
handlers.onEvent('ui.state.changed', {revision: 3, namespaces: {photoelectric: {
    selectedTool: 'filter-wheel', potInterval: '36'
}}});
equal(toolbar.querySelector('[group-id="potentiometer"]').classList.contains('active'), true);
equal(interval.value, '360');
follow.click();
equal(toolbar.querySelector('[group-id="filter-wheel"]').classList.contains('active'), true);
equal(interval.value, '36');
equal(calls.length, before);
handlers.onEvent('ui.state.changed', {revision: 4, namespaces: {photoelectric: {
    selectedTool: 'potentiometer'
}}});
equal(toolbar.querySelector('[group-id="potentiometer"]').classList.contains('active'), true);
equal(interval.value, ''); // A replacement without potInterval must not retain the old value.
handlers.onEvent('ui.state.changed', {revision: 5, namespaces: {photoelectric: {
    potInterval: '36'
}}});
equal(toolbar.querySelector('[group-id="potentiometer"]').classList.contains('active'), false);
equal(interval.value, '36');
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: false, lifecycle: 'draining'});
handlers.onEvent('ui.state.changed', {revision: 6, namespaces: {}});
equal(toolbar.querySelector('[group-id="filter-wheel"]').classList.contains('active'), false);
equal(interval.value, '');
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: true, lifecycle: 'ready'});
handlers.onQueue({position: null, waitingCount: 0, hasActiveOwner: false});
handlers.onEvent('ownership.control', {hasControl: true, handoffRequired: false, lifecycle: 'ready'});
await eventually(() => calls.length > before);
equal(calls.at(-1)[2].values, {selectedTool: '', potInterval: ''});
handlers.onClose({code: 1006});
equal(window.remlaJsonLatestUiState, null);
assert(follow.hidden, 'follow option hides after disconnect');
""")

    def test_pot_interval_placeholder_survives_initial_and_follow_view_clear(self):
        self.run_browser("""
for (const name of ['toggle', 'header', 'toolbar', 'tool-detail', 'knob']) {
    await import('/static/js/components/' + name + '.js');
}
const header = document.createElement('header-component');
const toolbar = document.createElement('toolbar-component');
toolbar.innerHTML = '<button group-id="potentiometer">Pot</button>';
const detail = document.createElement('tool-detail-component');
detail.innerHTML = '<div id="potentiometer"><knob-component device-name="Pot" intervals="[3.6,36]" degrees-per-step="1.8"></knob-component></div>';
document.body.append(header, toolbar, detail);
const knob = detail.querySelector('knob-component');
const interval = knob.shadowRoot.querySelector('select');
const placeholder = () => {
    equal(interval.selectedIndex, 0);
    equal(interval.selectedOptions[0].textContent.trim(), 'Select an interval');
    equal(interval.value, '');
    equal(knob.selectedInterval || '', '');
};
placeholder();
let handlers;
const calls = [];
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = new Map(); }
    connect() {}
    command(...args) { calls.push(args); return Promise.resolve({ok: true}); }
};
await import('/static/js/remlaJsonApp.js');
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new Event('DOMContentLoaded'));
handlers.onEvent('ownership.control', {hasControl: true, handoffRequired: false, lifecycle: 'ready'});
placeholder(); // Ownership setup clears the view before the first selection.
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: false, lifecycle: 'ready'});
handlers.onQueue({position: 1, waitingCount: 1, hasActiveOwner: true});
handlers.onEvent('ui.state.changed', {revision: 1, namespaces: {photoelectric: {
    selectedTool: 'potentiometer', potInterval: '36'
}}});
equal(interval.value, '36');
handlers.onEvent('ui.state.changed', {revision: 2, namespaces: {photoelectric: {
    selectedTool: 'potentiometer'
}}});
placeholder(); // An owner with no chosen interval must show the prompt, not a blank box.
assert(calls.every(call => call[0] === 'Experiment'), 'follow must not send hardware commands');
""")

    def test_early_ui_snapshot_applies_only_after_waiting_control_and_queue(self):
        self.run_browser("""
await import('/static/js/components/toggle.js');
await import('/static/js/components/header.js');
await import('/static/js/components/toolbar.js');
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/knob.js');
const header = document.createElement('header-component');
const toolbar = document.createElement('toolbar-component');
toolbar.innerHTML = '<button group-id="potentiometer">Pot</button>';
const detail = document.createElement('tool-detail-component');
detail.innerHTML = '<div id="potentiometer"><knob-component device-name="Pot" intervals="[3.6,36]" degrees-per-step="1.8"></knob-component></div>';
document.body.append(header, toolbar, detail);
let handlers;
const calls = [];
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = new Map(); }
    connect() {}
    command(...args) { calls.push(args); return Promise.resolve({ok: true}); }
};
await import('/static/js/remlaJsonApp.js');
handlers.onEvent('ui.state.snapshot', {revision: 1, namespaces: {photoelectric: {
    selectedTool: 'potentiometer', potInterval: '36'
}}});
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new Event('DOMContentLoaded'));
const interval = detail.querySelector('knob-component').shadowRoot.querySelector('select');
assert(!toolbar.querySelector('button').classList.contains('active'), 'snapshot alone cannot choose viewer mode');
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: false, lifecycle: 'ready'});
handlers.onQueue({position: 1, waitingCount: 1, hasActiveOwner: true});
equal(toolbar.querySelector('button').classList.contains('active'), true);
equal(interval.value, '36');
equal(calls.length, 0);
""")

    def run_control_follow_browser(self, scenario, deferred_map=False):
        self.run_browser('const deferMap = ' + json.dumps(deferred_map) + ';\n' + """
// Use the deployed page's existing controls and SVGs, not substitute widgets.
for (const name of ['toggle', 'header', 'toolbar', 'tool-detail', 'knob', 'imgMapDevice']) {
    await import('/static/js/components/' + name + '.js');
}
const source = new DOMParser().parseFromString(
    await (await reportFetch('/PhotoElectricEffect/zindex.html')).text(), 'text/html');
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
let releaseMap;
const mapGate = new Promise(resolve => { releaseMap = resolve; });
window.fetch = async (...args) => {
    if (deferMap && String(args[0]).includes('ElectrometerMap.html')) await mapGate;
    return reportFetch(...args);
};
for (const tag of ['header-component', 'tool-detail-component', 'toolbar-component']) {
    document.body.append(document.importNode(source.querySelector(tag), true));
}
const header = document.querySelector('header-component');
const toolbar = document.querySelector('toolbar-component');
const detail = document.querySelector('tool-detail-component');
detail.style.width = '560px';
detail.style.height = '480px';
const pot = document.querySelector('knob-component[device-name="Pot"]');
const lamp = document.querySelector('toggle-component[device-name="HgNeLamp"]');
const ambient = header.shadowRoot.querySelector('toggle-component[device-name="Ambient"]');
const mapFor = device => document.querySelector(`img-map-device[device-name="${device}"]`);
for (const map of document.querySelectorAll('img-map-device')) {
    if (!deferMap || map.getAttribute('device-name') !== 'Electrometer') {
        await eventually(() => map.shadowRoot.querySelector('svg'));
    }
}
let handlers;
const calls = [];
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = new Map(); }
    connect() {}
    command(...args) { calls.push(args); return Promise.resolve({ok: true}); }
};
await import('/static/js/remlaJsonApp.js');
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new Event('DOMContentLoaded'));
const control = hasControl => handlers.onEvent('ownership.control', {
    hasControl, handoffRequired: false, lifecycle: 'ready'
});
const waitForOwner = () => {
    control(false);
    handlers.onQueue({position: 1, waitingCount: 1, hasActiveOwner: true});
};
const targetFor = (device, id) => {
    const host = device === 'Pot' ? pot : device === 'HgNeLamp' ? lamp
        : device === 'Ambient' ? ambient : mapFor(device);
    return host.shadowRoot.getElementById(id);
};
const cases = [
    ['potentiometer', 'knob', 'Pot', 'up', 'move', ['2']],
    ['electrometer', 'map', 'Electrometer', 'AutoRange6514', 'press', ['SYST:KEY 12']],
    ['multimeter', 'map', 'Multimeter', 'AutoRange2000', 'press', ['SYST:KEY 12']],
    ['filter-wheel', 'map', 'colorWheel', 'f365', 'goto', ['0deg']],
    ['density-wheel', 'map', 'densityWheel', 'nd03', 'goto', ['300deg']],
    ['mercury-neon-lamp', 'toggle', 'HgNeLamp', 'toggle-image', 'power_on', []],
    ['potentiometer', 'toggle', 'Ambient', 'toggle-image', 'power_on', []],
];
const valuesFor = (item, sequence = 1) => ({
    selectedTool: item[0], potInterval: '3.6', lastControlKind: item[1],
    lastControlDevice: item[2], lastControlId: item[3], lastControlRevision: sequence,
});
const receive = (values, revision = 1, event = 'ui.state.changed') => handlers.onEvent(event, {
    revision, namespaces: {photoelectric: values}
});
const roots = [pot, lamp, ambient, ...document.querySelectorAll('img-map-device')];
const selected = () => roots.flatMap(host => [...host.shadowRoot.querySelectorAll('.selected')]);
const assertHighlight = async target => {
    try {
        await eventually(() => selected().length === 1 && selected()[0] === target);
    } catch (error) {
        throw Error(`expected only ${target.id} highlighted; received ${selected().map(node => node.id)}`);
    }
    const bounds = target.getBoundingClientRect();
    assert(bounds.width > 0 && bounds.height > 0, 'highlight must be on the visible existing control');
    const style = getComputedStyle(target);
    assert(style.visibility !== 'hidden' && style.display !== 'none', 'highlight must be visible');
};
""" + scenario, viewport=(1200, 900))

    def test_owner_control_clicks_publish_flattened_ui_intent_with_current_view(self):
        for index, device in enumerate(('Pot', 'Electrometer', 'Multimeter', 'colorWheel',
                                        'densityWheel', 'HgNeLamp', 'Ambient')):
            with self.subTest(device=device):
                self.run_control_follow_browser('const item = cases[' + str(index) + '];\n' + """
control(true);
toolbar.querySelector(`[group-id="${item[0]}"]`).click();
const interval = pot.shadowRoot.querySelector('select');
interval.value = '3.6';
interval.dispatchEvent(new Event('change'));
await eventually(() => calls.some(call => call[1] === 'set_ui_state'));
await tick();
calls.length = 0;
const target = targetFor(item[2], item[3]);
target.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}));
await tick();
equal(calls.filter(call => call[0] !== 'Experiment'), [[item[2], item[4], {arguments: item[5]}]]);
const publication = calls.find(call => call[0] === 'Experiment' && call[1] === 'set_ui_state');
assert(publication, `${item[2]} click must publish presentation intent, not only a hardware command`);
equal(publication[2].namespace, 'photoelectric');
const values = publication[2].values;
equal([values.selectedTool, values.potInterval, values.lastControlKind,
    values.lastControlDevice, values.lastControlId], [item[0], '3.6', item[1], item[2], item[3]]);
if (item[1] === 'knob' || item[1] === 'map') {
    const host = target.getRootNode().host;
    assert(!host.pending && !host.hasAttribute('data-command-pending'),
        'command completion must clear pending before the next real control click');
    calls.length = 0;
    target.dispatchEvent(new MouseEvent('click', {bubbles: true, composed: true}));
    await tick();
    const repeated = calls.find(call => call[1] === 'set_ui_state');
    assert(repeated && JSON.stringify(repeated[2].values) !== JSON.stringify(values),
        'a repeated same-control click must publish distinct replayable state');
    equal(calls.filter(call => call[0] !== 'Experiment'), [[item[2], item[4], {arguments: item[5]}]]);
}
""")

    def test_follower_highlights_exactly_one_existing_control_without_hardware_echo(self):
        self.run_control_follow_browser("""
waitForOwner();
let revision = 0;
for (const item of cases) {
    receive(valuesFor(item, ++revision), revision);
    const target = targetFor(item[2], item[3]);
    await assertHighlight(target);
    if (item[1] === 'map') {
        let retriggered = false;
        const observer = new MutationObserver(records => {
            if (records.some(record => record.attributeName === 'class'
                && record.oldValue !== record.target.getAttribute('class'))) retriggered = true;
        });
        observer.observe(target, {attributes: true, subtree: true, attributeOldValue: true});
        target.addEventListener('animationstart', () => { retriggered = true; }, {once: true});
        receive(valuesFor(item, ++revision), revision);
        await eventually(() => retriggered);
        observer.disconnect();
        await assertHighlight(target);
    }
    equal(calls, []);
    // Presentation intent must not pretend an unconfirmed power change occurred.
    equal(lamp.enabled, false);
    equal(ambient.enabled, false);
}
""")

    def test_follower_retriggers_same_arrow_and_opt_out_preserves_local_view(self):
        self.run_control_follow_browser("""
waitForOwner();
receive(valuesFor(cases[0]), 1);
const up = targetFor('Pot', 'up');
await assertHighlight(up);
let retriggered = false;
const observer = new MutationObserver(records => {
    if (records.some(record => record.attributeName === 'class'
        && record.oldValue !== record.target.getAttribute('class'))) retriggered = true;
});
observer.observe(up, {attributes: true, subtree: true, attributeOldValue: true});
up.addEventListener('animationstart', () => { retriggered = true; });
receive(valuesFor(cases[0], 2), 2);
await eventually(() => retriggered);
observer.disconnect();
await assertHighlight(up);
header.shadowRoot.querySelector('input[name="follow-controller"]').click();
toolbar.querySelector('[group-id="electrometer"]').click();
receive(valuesFor(cases[3], 3), 3);
await tick();
assert(toolbar.querySelector('[group-id="electrometer"]').classList.contains('active'),
    'opt-out must retain locally chosen tool');
assert(!targetFor('colorWheel', 'f365').classList.contains('selected'),
    'opt-out must not mirror remote control highlights');
header.shadowRoot.querySelector('input[name="follow-controller"]').click();
await assertHighlight(targetFor('colorWheel', 'f365'));
toolbar.querySelector('[group-id="potentiometer"]').click();
equal(header.shadowRoot.querySelector('input[name="follow-controller"]').checked, false);
equal(selected().length, 0); // Local browsing must not keep the controller's last click.
handlers.onClose({code: 1006});
equal(selected().length, 0);
waitForOwner();
receive(valuesFor(cases[0], 4), 4);
await assertHighlight(up);
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: true, lifecycle: 'ready'});
equal(selected().length, 0);
equal(calls, []);
""")

    def test_late_snapshot_waits_for_svg_and_rejects_non_control_map_ids(self):
        self.run_control_follow_browser("""
// The transport can supply a snapshot before control/queue negotiation or SVG fetch completion.
receive(valuesFor(cases[1]), 1, 'ui.state.snapshot');
equal(selected().length, 0);
waitForOwner();
equal(mapFor('Electrometer').shadowRoot.querySelector('svg'), null);
releaseMap();
await eventually(() => mapFor('Electrometer').shadowRoot.querySelector('svg'));
await assertHighlight(targetFor('Electrometer', 'AutoRange6514'));
for (const [index, badId] of ['not-a-control', 'AutoRange6514, svg', '<img src=x onerror=alert(1)>'].entries()) {
    receive({...valuesFor(cases[1]), lastControlId: badId}, index + 2);
    await tick();
    equal(selected().length, 0);
}
// An existing SVG decoration is still not an authorized command hotspot.
receive({...valuesFor(cases[3]), lastControlId: 'FilterWheelScaledPNG'}, 5);
await tick();
equal(selected().length, 0);
receive({...valuesFor(cases[1]), lastControlDevice: 'unconfigured-device'}, 6);
await tick();
equal(selected().length, 0);
receive(valuesFor(cases[1], 7), 7);
await assertHighlight(targetFor('Electrometer', 'AutoRange6514'));
handlers.onEvent('ui.state.changed', {revision: 8, namespaces: {}});
equal(selected().length, 0);
equal(calls, []);
""", deferred_map=True)

    def test_unwired_shared_components_do_not_add_persistent_command_highlights(self):
        self.run_browser("""
await import('/static/js/components/imgMapDevice.js');
await import('/static/js/components/toggle.js');
const map = document.createElement('img-map-device');
map.setAttribute('device-name', 'Electrometer');
map.setAttribute('map-html-file', '/static/svg/ElectrometerMap.html');
const toggle = document.createElement('toggle-component');
toggle.setAttribute('device-name', 'Ambient');
document.body.append(map, toggle);
await eventually(() => map.shadowRoot.getElementById('AutoRange6514'));
map.shadowRoot.getElementById('AutoRange6514').dispatchEvent(new MouseEvent('click', {bubbles: true}));
toggle.shadowRoot.getElementById('toggle-image').dispatchEvent(new MouseEvent('click', {bubbles: true}));
assert(!map.shadowRoot.querySelector('.selected'), 'unwired lab map must retain hover-only behavior');
assert(!toggle.shadowRoot.querySelector('.selected'), 'unwired lab toggle must not suggest confirmed action');
""")

    def test_delayed_ui_ack_cannot_republish_old_click_after_fault_recovery(self):
        self.run_control_follow_browser("""
let releaseFirst;
let holdFirst = true;
const realUiState = window.remlaUiState;
window.remlaUiState = (namespace, values) => {
    const result = realUiState(namespace, values);
    if (holdFirst) {
        holdFirst = false;
        return new Promise(resolve => { releaseFirst = () => resolve(result); });
    }
    return result;
};
control(true);
await eventually(() => typeof releaseFirst === 'function');
const before = calls.length;
toolbar.querySelector('[group-id="electrometer"]').click();
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: false, lifecycle: 'faulted'});
// Even if the asynchronous backend clear has not arrived, recovery must not revive the click.
control(true);
releaseFirst();
await eventually(() => calls.length > before);
await tick();
const later = calls.slice(before).filter(call => call[1] === 'set_ui_state');
assert(later.length > 0, 'new owner should publish its view');
assert(later.every(call => !('lastControlId' in call[2].values)),
    'queued pre-fault clicks must not be sent after ownership resumes');
equal(selected().length, 0);
""")

    def test_server_alerts_render_as_safe_dismissible_dialogs_even_if_early(self):
        page = PageElements((ROOT / 'PhotoElectricEffect/zindex.html').read_text())
        self.assertEqual(sum(tag == 'alert-dialog' for tag, _ in page.elements), 1)
        self.run_browser("""
let handlers;
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = new Map(); }
    connect() {}
};
await import('/static/js/remlaJsonApp.js');
handlers.onEvent('alert', {severity: 'warning', title: '<img src=x onerror=alert(1)>',
    message: 'Check <script>unsafe</scr' + 'ipt>'});
await import('/static/js/components/alert-dialog.js');
const focusBefore = document.createElement('button');
document.body.append(focusBefore);
focusBefore.focus();
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
const root = dialog.shadowRoot;
assert(dialog.style.display === 'flex', 'early server alert must be replayed');
assert(root.querySelector('[role="alertdialog"]'), 'alert dialog must have an accessible role');
equal(root.querySelector('#title').textContent, '<img src=x onerror=alert(1)>');
equal(root.querySelector('#message').textContent, 'Check <script>unsafe</scr' + 'ipt>');
assert(!root.querySelector('img, script'), 'server text must not become markup');
assert(root.activeElement === root.querySelector('#close'), 'OK must be keyboard reachable');
root.querySelector('#close').click();
equal(dialog.style.display, 'none');
assert(document.activeElement === focusBefore, 'dismissal restores previous focus');
handlers.onEvent('alert', {severity: 'info', title: 'ReMLA', message: 'Next alert'});
equal(root.querySelector('#message').textContent, 'Next alert');
root.querySelector('#close').click();
handlers.onEvent('alert', {severity: 'info', title: 'ReMLA',
    message: 'Experiment/controlStatus/0,The experiment is not accepting control actions.'});
equal(root.querySelector('#message').textContent, 'The experiment is not accepting control actions.');
root.querySelector('#close').click();
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
window.remlaJsonLatestControl = {hasControl: true, lifecycle: 'ready'};
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

    def test_photoelectric_handoff_uses_explicit_yes_reset_no_continue_without_duplicates(self):
        self.run_browser("""
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
let finish;
const calls = [];
window.confirm = () => { throw Error('native confirm must not be used'); };
window.remlaCommand = (...args) => { calls.push(args); return new Promise(r => finish = r); };
window.remlaJsonPendingHandoff = {expiresAt: 123};
await import('/PhotoElectricEffect/static/js/app.js');
assert(dialog.style.display === 'flex', 'early handoff should show a prompt');
equal(calls.length, 0);
assert(dialog.shadowRoot.querySelector('#message').textContent.includes('reset'), 'ask clearly about resetting');
dialog.shadowRoot.querySelector('#yes').click();
await tick();
equal(calls[0], ['Experiment', 'handoff', {choice: 'reset'}]);
equal(window.remlaJsonPendingHandoff, null);
window.dispatchEvent(new CustomEvent('remla:ownership-handoff', {detail: {}}));
equal(calls.length, 1);
finish({});
await tick();
window.dispatchEvent(new CustomEvent('remla:ownership-handoff', {detail: {}}));
await tick();
assert(dialog.style.display === 'flex', 'subsequent handoff should prompt again');
dialog.shadowRoot.querySelector('#no').click();
await tick();
equal(calls[1], ['Experiment', 'handoff', {choice: 'continue'}]);
finish({});
""")

    def test_handoff_prompt_takes_priority_over_server_alerts_and_disconnect_sends_no_choice(self):
        self.run_browser("""
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
window.dispatchEvent(new CustomEvent('remla:alert', {detail: {title: 'ReMLA',
    message: 'Experiment/controlStatus/0,Choose CONTROL/handoff/reset.'}}));
assert(getComputedStyle(dialog).display === 'none', 'control status belongs in the queue header');
window.dispatchEvent(new CustomEvent('remla:alert', {detail: {
    title: 'Notice', message: 'First informational message', severity: 'info'
}}));
equal(dialog.shadowRoot.querySelector('#message').textContent, 'First informational message');
let calls = [];
window.remlaCommand = (...args) => { calls.push(args); return Promise.resolve({}); };
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new CustomEvent('remla:ownership-handoff', {detail: {}}));
await tick();
assert(dialog.shadowRoot.querySelector('#message').textContent.includes('reset'), 'handoff must preempt informational alert');
window.dispatchEvent(new CustomEvent('remla:alert', {detail: {title: 'Second', message: 'Queued notice'}}));
assert(dialog.shadowRoot.querySelector('#message').textContent.includes('reset'), 'alerts must not overwrite a pending choice');
window.dispatchEvent(new Event('remla:connection-closed'));
await tick();
equal(calls.length, 0);
equal(dialog.style.display, 'none');
""")

    def test_handoff_waits_for_dialog_module_before_answering(self):
        self.run_browser("""
const calls = [];
window.remlaCommand = (...args) => { calls.push(args); return Promise.resolve({}); };
window.remlaJsonPendingHandoff = {timeoutSeconds: 60};
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
await import('/PhotoElectricEffect/static/js/app.js');
equal(calls.length, 0);
await import('/static/js/components/alert-dialog.js');
await eventually(() => dialog.style.display === 'flex');
dialog.shadowRoot.querySelector('#no').click();
await eventually(() => calls.length === 1);
equal(calls[0], ['Experiment', 'handoff', {choice: 'continue'}]);
""")

    def test_handoff_expiring_before_dialog_module_load_does_not_offer_stale_choice(self):
        self.run_browser("""
const calls = [];
window.remlaCommand = (...args) => { calls.push(args); return Promise.resolve({}); };
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new CustomEvent('remla:ownership-handoff', {detail: {timeoutSeconds: 60}}));
window.remlaJsonLatestControl = {handoffRequired: false, hasControl: true};
window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail: window.remlaJsonLatestControl}));
await import('/static/js/components/alert-dialog.js');
await tick();
assert(getComputedStyle(dialog).display === 'none', 'expired handoff cannot reopen after module loads');
dialog.shadowRoot.querySelector('#yes').click();
equal(calls.length, 0);
""")

    def test_disconnect_before_page_module_load_clears_early_handoff(self):
        self.run_browser("""
let handlers;
const calls = [];
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = new Map(); }
    connect() {}
    command(...args) { calls.push(args); return Promise.resolve({}); }
};
await import('/static/js/remlaJsonApp.js');
handlers.onEvent('ownership.handoff', {timeoutSeconds: 60});
assert(window.remlaJsonPendingHandoff, 'fixture retained the early handoff');
handlers.onClose({code: 1006});
equal(window.remlaJsonPendingHandoff, null);
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
await import('/PhotoElectricEffect/static/js/app.js');
assert(getComputedStyle(dialog).display === 'none', 'disconnected handoff must not be replayed');
dialog.shadowRoot.querySelector('#yes').click();
equal(calls.length, 0);
""")

    def test_alert_dismissal_restores_focus_inside_header_shadow_root(self):
        self.run_browser("""
await import('/static/js/components/toggle.js');
await import('/static/js/components/header.js');
await import('/static/js/components/alert-dialog.js');
const header = document.createElement('header-component');
document.body.append(header);
const manuals = header.shadowRoot.querySelector('button.manuals');
manuals.focus();
assert(header.shadowRoot.activeElement === manuals, 'fixture focused Manuals');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
window.dispatchEvent(new CustomEvent('remla:alert', {detail: {title: 'Server', message: 'Notice'}}));
dialog.shadowRoot.querySelector('#close').click();
assert(header.shadowRoot.activeElement === manuals, 'restore focus to the original control, not its host');
""")

    def test_handoff_timeout_dismisses_prompt_without_sending_stale_choice(self):
        self.run_browser("""
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
const calls = [];
window.remlaCommand = (...args) => { calls.push(args); return Promise.resolve({}); };
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new CustomEvent('remla:ownership-handoff', {detail: {timeoutSeconds: 60}}));
await eventually(() => dialog.style.display === 'flex');
window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail: {
    handoffRequired: false, hasControl: true, lifecycle: 'ready'
}}));
await tick();
equal(dialog.style.display, 'none');
dialog.shadowRoot.querySelector('#yes').click();
equal(calls.length, 0);
""")

    def test_queued_server_alerts_resume_after_handoff_choice(self):
        self.run_browser("""
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
window.dispatchEvent(new CustomEvent('remla:alert', {detail: {title: 'First', message: 'First notice'}}));
const choice = dialog.confirm({kind: 'handoff', title: 'Reset?', message: 'Reset lab?'});
window.dispatchEvent(new CustomEvent('remla:alert', {detail: {title: 'Second', message: 'Second notice'}}));
equal(dialog.shadowRoot.querySelector('#message').textContent, 'Reset lab?');
dialog.shadowRoot.querySelector('#yes').click();
equal(await choice, true);
equal(dialog.shadowRoot.querySelector('#message').textContent, 'First notice');
dialog.shadowRoot.querySelector('#close').click();
equal(dialog.shadowRoot.querySelector('#message').textContent, 'Second notice');
dialog.shadowRoot.querySelector('#close').click();
equal(dialog.style.display, 'none');
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

    def test_photoelectric_queue_notice_and_control_lock_follow_ownership(self):
        self.run_browser("""
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
await import('/static/js/components/toggle.js');
await import('/static/js/components/knob.js');
await import('/static/js/components/header.js');
await import('/static/js/components/alert-dialog.js');
const header = document.createElement('header-component');
header.setAttribute('data-enable-ambient-light', 'true');
const detail = document.createElement('tool-detail-component');
detail.innerHTML = `<div class="tool-interface"><toggle-component device-name="HgNeLamp"></toggle-component>
    <knob-component device-name="Pot" command-name="move" degrees-per-step="1.8"
        intervals="[3.6,36,360]"></knob-component><img-map-device device-name="colorWheel"></img-map-device></div>`;
const dialog = document.createElement('alert-dialog');
document.body.append(header, detail, dialog);
const calls = [];
window.remlaCommand = (...args) => { calls.push(args); return Promise.resolve({}); };
await import('/PhotoElectricEffect/static/js/app.js');
window.dispatchEvent(new Event('DOMContentLoaded'));
const controls = [...detail.querySelectorAll('toggle-component, knob-component, img-map-device')];
const ambient = header.shadowRoot.querySelector('toggle-component');
const lamp = controls[0];
assert(controls.every(control => control.inert) && ambient.inert, 'initially no control: all tools disabled');
const interval = controls[1].shadowRoot.querySelector('select');
header.shadowRoot.querySelector('button.manuals').focus();
interval.focus();
assert(controls[1].shadowRoot.activeElement !== interval, 'disabled knob interval cannot receive focus');
assert(parseFloat(getComputedStyle(detail.querySelector('.tool-interface')).opacity) < 1,
    'disabled tool controls are visibly greyed out');
assert(getComputedStyle(header.shadowRoot.querySelector('.toggle')).opacity !== '1',
    'ambient switch is greyed out without ownership');
window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail: {
    hasControl: false, handoffRequired: false, lifecycle: 'ready'
}}));
window.dispatchEvent(new CustomEvent('remla:ownership-queue', {detail: {
    position: 2, waitingCount: 3, hasActiveOwner: true
}}));
await eventually(() => dialog.style.display === 'flex');
equal(dialog.shadowRoot.querySelector('#title').textContent, 'Waiting for control');
assert(dialog.shadowRoot.querySelector('#message').textContent.includes('cannot control'),
    'new queued visitor sees that tools cannot be used yet');
lamp.shadowRoot.querySelector('img').click();
window.dispatchEvent(new CustomEvent('remla-command', {detail: {
    deviceName: 'Pot', commandName: 'move', arguments: ['2']
}}));
await tick();
equal(calls, []);
dialog.shadowRoot.querySelector('#close').click();
window.dispatchEvent(new CustomEvent('remla:ownership-queue', {detail: {
    position: 1, waitingCount: 2, hasActiveOwner: true
}}));
await tick();
equal(dialog.style.display, 'none'); // Position updates stay in the header, not repeated modals.
window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail: {
    hasControl: true, handoffRequired: false, lifecycle: 'ready'
}}));
assert(controls.every(control => !control.inert) && !ambient.inert, 'owner can use tools again');
equal(getComputedStyle(detail.querySelector('.tool-interface')).opacity, '1');
interval.focus();
assert(controls[1].shadowRoot.activeElement === interval, 'owner can focus knob interval');
lamp.shadowRoot.querySelector('img').click();
equal(calls[0], ['HgNeLamp', 'power_on', []]);
window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail: {
    hasControl: false, handoffRequired: false, lifecycle: 'faulted'
}}));
assert(controls.every(control => control.inert), 'faults also disable hardware controls');
equal(dialog.style.display, 'none'); // A fault must not be presented as normal queue waiting.
window.dispatchEvent(new Event('remla:connection-closed'));
assert(controls.every(control => control.inert) && ambient.inert, 'disconnect disables tools');
""")

    def test_early_queue_notice_does_not_survive_promotion_or_disconnection(self):
        self.run_browser("""
let handlers;
window.RemlaJsonSocket = class {
    constructor(options) { handlers = options.handlers; this.pending = new Map(); }
    connect() {}
};
await import('/static/js/remlaJsonApp.js');
handlers.onQueue({position: 1, waitingCount: 2, hasActiveOwner: true});
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: false, lifecycle: 'ready'});
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
await import('/PhotoElectricEffect/static/js/app.js');
await import('/static/js/components/alert-dialog.js');
await eventually(() => dialog.style.display === 'flex');
equal(dialog.shadowRoot.querySelector('#title').textContent, 'Waiting for control');
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: true, lifecycle: 'ready'});
await tick();
equal(dialog.style.display, 'none');
const choices = [];
window.remlaCommand = (...args) => { choices.push(args); return Promise.resolve({}); };
handlers.onEvent('ownership.handoff', {timeoutSeconds: 60});
await eventually(() => dialog.shadowRoot.querySelector('#no').hidden === false);
dialog.shadowRoot.querySelector('#no').click();
await tick();
equal(choices, [['Experiment', 'handoff', {choice: 'continue'}]]);
equal(dialog.style.display, 'none'); // The obsolete queue notice must not resume after handoff.
handlers.onEvent('ownership.control', {hasControl: true, handoffRequired: false, lifecycle: 'ready'});
handlers.onQueue({position: null, waitingCount: 1, hasActiveOwner: true});
await tick();
equal(dialog.style.display, 'none');
handlers.onClose({code: 1006});
handlers.onEvent('ownership.control', {hasControl: false, handoffRequired: false, lifecycle: 'ready'});
handlers.onQueue({position: 1, waitingCount: 1, hasActiveOwner: true});
await eventually(() => dialog.style.display === 'flex');
equal(dialog.shadowRoot.querySelector('#title').textContent, 'Waiting for control');
handlers.onClose({code: 1006});
equal(dialog.style.display, 'none');
""")

    def test_queue_notice_waiting_for_dialog_recovers_after_draining(self):
        self.run_browser("""
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
await import('/PhotoElectricEffect/static/js/app.js');
const control = lifecycle => window.dispatchEvent(new CustomEvent('remla:ownership-control', {
    detail: {hasControl: false, handoffRequired: false, lifecycle}
}));
control('ready');
window.dispatchEvent(new CustomEvent('remla:ownership-queue', {detail: {
    position: 2, waitingCount: 2, hasActiveOwner: true
}}));
control('draining'); // An owner disconnect can pause admission while the dialog module is loading.
await import('/static/js/components/alert-dialog.js');
await tick();
equal(getComputedStyle(dialog).display, 'none');
control('ready');
await eventually(() => dialog.style.display === 'flex');
equal(dialog.shadowRoot.querySelector('#title').textContent, 'Waiting for control');
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

    def test_mercury_neon_lamp_photo_sits_with_switch_not_description(self):
        for viewport in ((1200, 800), (375, 667)):
            with self.subTest(viewport=viewport):
                self.run_browser("""
const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/static/css/app.css';
document.head.append(stylesheet);
await new Promise((resolve, reject) => { stylesheet.onload = resolve; stylesheet.onerror = reject; });
await import('/static/js/components/tool-detail.js');
await import('/static/js/components/toggle.js');
const source = new DOMParser().parseFromString(
    await (await reportFetch('/PhotoElectricEffect/zindex.html')).text(), 'text/html');
const detail = document.createElement('tool-detail-component');
detail.append(document.importNode(source.querySelector('#mercury-neon-lamp'), true));
detail.style.width = innerWidth < 768 ? '320px' : '460px';
detail.style.height = innerWidth < 768 ? '380px' : '440px';
document.body.append(detail);
window.dispatchEvent(new CustomEvent('toolbarSelection', {detail: {toolGroupId: 'mercury-neon-lamp'}}));
const tool = detail.querySelector('#mercury-neon-lamp');
const heading = tool.querySelector('.tool-heading');
const panel = tool.querySelector('.tool-interface');
const photo = panel.querySelector('img[alt="photo of Hg-Ne Pen Ray Lamp"]');
assert(photo && !heading.querySelector('img'), 'lamp photograph belongs with the switch, not the description');
assert(photo.getAttribute('src') === './static/imgs/transparent-imgs/penray-lamp.png', 'keep the original lamp picture');
// Use a same-aspect inline fixture so layout checks do not depend on page asset availability.
photo.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1464" height="224"/>';
await eventually(() => photo.complete && photo.naturalWidth > 0);
const box = panel.getBoundingClientRect();
const image = photo.getBoundingClientRect();
assert(image.width > 50 && image.height > 0 && image.left >= box.left - 2 &&
    image.right <= box.right + 2 && image.top >= box.top - 2 && image.bottom <= box.bottom + 2,
    'lamp photo should fit visibly within the switch panel');
const toggle = panel.querySelector('toggle-component');
const switchImage = toggle.shadowRoot.querySelector('img');
await eventually(() => switchImage.complete && switchImage.naturalWidth > 0);
const hit = switchImage.getBoundingClientRect();
const available = toggle.getBoundingClientRect();
const inner = toggle.shadowRoot.querySelector('.toggle').getBoundingClientRect();
assert(Math.abs(hit.height - available.height) < 3,
    `switch must fill its remaining area: ${JSON.stringify({available: [available.width, available.height], inner: [inner.width, inner.height], image: [hit.width, hit.height], panel: [box.width, box.height]})}`);
assert(hit.width > 0 && hit.height > 0 && hit.top >= image.bottom - 2 &&
    hit.bottom <= box.bottom + 2, 'switch should remain visible below the lamp photo');
assert(toggle.shadowRoot.elementFromPoint(hit.x + hit.width / 2, hit.y + hit.height / 2) === switchImage,
    'lamp photo must not block the switch');
const instruction = panel.querySelector('.tool-instruction').getBoundingClientRect();
assert(instruction.bottom <= box.bottom + 2, 'switch instruction remains in the panel');
""", viewport=viewport)

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
const lampPhoto = detail.querySelector('.tool-lamp-img');
if (lampPhoto) {
    lampPhoto.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1464" height="224"/>';
    await eventually(() => lampPhoto.complete && lampPhoto.naturalWidth > 0);
}
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

    def test_snapshot_component_emits_intent_without_transport(self):
        self.run_browser("""
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/video.js');
const component = document.createElement('video-component');
component.dataset.views = '[]';
component.style.width = '640px';
component.style.height = '360px';
document.body.append(component);
const button = component.shadowRoot.querySelector('#take-snapshot');
const overlay = component.shadowRoot.querySelector('.snapshot-overlay');
const intents = [];
window.addEventListener('remla:snapshot-request', event => intents.push(event.detail));
window.remlaCommand = () => { throw Error('component must not call transport'); };
assert(button.disabled, 'snapshot is unavailable without a page bridge grant');
assert(overlay?.hidden, 'progress overlay is initially hidden');
component.setSnapshotState({enabled: true});
button.click();
equal(intents.length, 1);
assert(intents[0].source === component, 'bridge needs the requesting video');
component.setSnapshotState({enabled: true, pending: true});
button.click();
equal(intents.length, 1);
assert(button.disabled && button.textContent.includes('Capturing'), 'pending is visible on button');
assert(!overlay.hidden && overlay.textContent.includes('live video may pause'), 'warn about stream interruption while pending');
equal(getComputedStyle(overlay).pointerEvents, 'none');
equal(overlay.getAttribute('role'), 'status');
const videoBounds = component.shadowRoot.querySelector('.video').getBoundingClientRect();
const overlayBounds = overlay.getBoundingClientRect();
assert(videoBounds.width > 0 && videoBounds.height > 0, 'video has measurable dimensions');
assert(Math.abs(videoBounds.width - overlayBounds.width) < 1 && Math.abs(videoBounds.height - overlayBounds.height) < 1,
    'translucent overlay covers the video region');
const measure = component.shadowRoot.querySelector('#measure-button');
const measureBounds = measure.getBoundingClientRect();
assert(measureBounds.width > 0, 'video controls remain visible');
assert(component.shadowRoot.elementFromPoint(measureBounds.x + measureBounds.width / 2,
    measureBounds.y + measureBounds.height / 2) === measure, 'overlay does not intercept video controls');
component.setSnapshotState({enabled: true, pending: false});
assert(overlay.hidden && !button.disabled, 'progress overlay clears after capture');
""")

    def test_snapshot_owner_download_is_private_and_recovers_video(self):
        self.run_browser("""
history.replaceState({}, '', '/photo1/index.html?keep=page');
const readers = [];
window.MediaMTXWebRTCReader = class {
    constructor(options) { this.options = options; this.closed = 0; readers.push(this); }
    close() { this.closed++; }
};
await import('/static/js/components/video.js');
const component = document.createElement('video-component');
component.dataset.views = '[]';
document.body.append(component);
await import('/PhotoElectricEffect/static/js/app.js');
const button = component.shadowRoot.querySelector('#take-snapshot');
window.dispatchEvent(new Event('DOMContentLoaded'));
const control = detail => window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail}));
const owner = {hasControl: true, handoffRequired: false, lifecycle: 'ready'};
const calls = [], downloads = [], revoked = [], fetched = [];
let finishCapture;
window.remlaCommand = (...args) => { calls.push(args); return new Promise(resolve => finishCapture = resolve); };
const blob = new Blob(['png fixture'], {type: 'image/png'});
window.fetch = async (url, options) => { fetched.push([String(url), options]); return {ok: true, blob: async () => blob}; };
URL.createObjectURL = value => { assert(value === blob, 'download the returned blob'); return 'blob:private-snapshot'; };
URL.revokeObjectURL = url => revoked.push(url);
HTMLAnchorElement.prototype.click = function () { downloads.push([this.href, this.download]); };
window.dispatchEvent(new CustomEvent('remla:snapshot-request', {detail: {source: component}}));
window.dispatchEvent(new CustomEvent('remla-command', {detail: {
    deviceName: 'Experiment', commandName: 'capture_still', arguments: {}
}}));
equal(calls, []); // Forged intent cannot bypass ownership.
control({...owner, handoffRequired: true});
assert(button.disabled, 'handoff is not ownership');
control({...owner, lifecycle: 'faulted'});
assert(button.disabled, 'faulted owner cannot capture');
control(owner);
assert(!button.disabled, 'ready owner can capture');
button.click();
button.click();
equal(calls, [['Experiment', 'capture_still', {}]]);
assert(button.disabled && button.textContent.includes('Capturing'), 'pending until download completes');
assert(!component.shadowRoot.querySelector('.snapshot-overlay').hidden, 'overlay stays during download');
finishCapture({data: {token: 'private-token', downloadPath: 'ws/snapshot', mimeType: 'image/png', width: 2592, height: 1944}});
await eventually(() => downloads.length === 1 && !button.disabled);
equal(fetched.length, 1);
equal(fetched[0][0], location.origin + '/photo1/ws/snapshot');
equal(fetched[0][1].headers.Authorization, 'Bearer private-token');
equal(fetched[0][1].redirect, 'error');
equal(fetched[0][1].cache, 'no-store');
equal(downloads, [['blob:private-snapshot', 'snapshot.png']]);
equal(revoked, []); // Keep the object URL alive until the browser starts the download.
await eventually(() => revoked.length === 1);
equal(revoked, ['blob:private-snapshot']);
equal(readers.length, 2);
equal(readers[0].closed, 1);
assert(component.shadowRoot.querySelector('.snapshot-overlay').hidden, 'overlay clears after download');
assert(!component.shadowRoot.textContent.includes('private-token'), 'never display credentials');
""")

    def test_snapshot_stale_owner_results_are_discarded_at_every_await(self):
        for stage, loss in ((stage, loss) for stage in ('command', 'fetch', 'blob')
                            for loss in ('disconnect', 'ownership')):
            with self.subTest(stage=stage, loss=loss):
                self.run_browser('const stage = ' + json.dumps(stage) + '; const loss = ' +
                                 json.dumps(loss) + ';\n' + """
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/video.js');
const component = document.createElement('video-component');
component.dataset.views = '[]';
document.body.append(component);
await import('/PhotoElectricEffect/static/js/app.js');
const owner = {hasControl: true, handoffRequired: false, lifecycle: 'ready'};
const control = detail => window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail}));
control(owner);
let release, waiting = false, fetches = 0, downloads = 0;
const pause = () => { waiting = true; return new Promise(resolve => release = resolve); };
const data = {data: {token: 'private-token', downloadPath: 'ws/snapshot', mimeType: 'image/png', width: 20, height: 10}};
const blob = new Blob(['png'], {type: 'image/png'});
const response = {ok: true, blob: () => stage === 'blob' ? pause() : Promise.resolve(blob)};
window.remlaCommand = () => stage === 'command' ? pause() : Promise.resolve(data);
window.fetch = () => { fetches++; return stage === 'fetch' ? pause() : Promise.resolve(response); };
URL.createObjectURL = () => { downloads++; return 'blob:should-not-be-created'; };
component.shadowRoot.querySelector('#take-snapshot').click();
await eventually(() => waiting);
if (loss === 'disconnect') window.dispatchEvent(new Event('remla:connection-closed'));
else control({...owner, hasControl: false});
control(owner); // Regaining ownership must not revive an old capture.
release(stage === 'command' ? data : stage === 'fetch' ? response : blob);
await tick(); await tick();
equal(downloads, 0);
equal(fetches, stage === 'command' ? 0 : 1);
assert(!component.shadowRoot.querySelector('#take-snapshot').disabled, 'pending clears after stale work finishes');
""")

    def test_snapshot_failures_are_visible_without_leaking_tokens(self):
        for failure in ('command', 'path', 'mime', 'dimensions', 'token', 'http', 'blob', 'blob_type'):
            with self.subTest(failure=failure):
                self.run_browser('const failure = ' + json.dumps(failure) + ';\n' + """
let readers = 0, fetches = 0;
window.MediaMTXWebRTCReader = class { constructor() { readers++; } close() {} };
await import('/static/js/components/video.js');
const component = document.createElement('video-component');
component.dataset.views = '[]';
document.body.append(component);
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
window.remlaJsonLatestControl = {hasControl: true, handoffRequired: false, lifecycle: 'ready'};
await import('/PhotoElectricEffect/static/js/app.js');
window.remlaCommand = () => failure === 'command' ? Promise.reject(Error('camera failed private-token')) : Promise.resolve({data: {
    token: 'private-token', downloadPath: failure === 'path' ? 'https://evil.invalid/snapshot' : 'ws/snapshot',
    mimeType: failure === 'mime' ? 'image/jpeg' : 'image/png', width: failure === 'dimensions' ? 0 : 20, height: 10,
    ...(failure === 'token' ? {token: 'bad token'} : {})
}});
window.fetch = async () => { fetches++; return {ok: failure !== 'http', blob: async () => {
    if (failure === 'blob_type') return new Blob(['not png'], {type: 'text/html'});
    throw Error('private-token');
}}; };
URL.createObjectURL = () => { throw Error('failed capture must not download'); };
const button = component.shadowRoot.querySelector('#take-snapshot');
button.click();
await eventually(() => !button.disabled);
assert(dialog.style.display === 'flex', 'show snapshot failure in the alert dialog');
assert(component.shadowRoot.querySelector('.snapshot-overlay').hidden, 'overlay clears on failure');
assert(dialog.shadowRoot.textContent.includes('Snapshot failed'), 'show an actionable capture error');
if (failure === 'http') assert(dialog.shadowRoot.textContent.includes('download'), 'distinguish download failure');
assert(!component.shadowRoot.textContent.includes('Snapshot failed'), 'do not put errors in video component');
assert(!dialog.shadowRoot.textContent.includes('private-token'), 'do not render raw token-bearing errors');
equal(fetches, ['command', 'path', 'mime', 'dimensions', 'token'].includes(failure) ? 0 : 1);
equal(readers, 2); // Failure may also have interrupted MediaMTX.
""")

    def test_snapshot_server_limits_are_distinct_from_capture_and_download_failures(self):
        self.run_browser("""
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/video.js');
const component = document.createElement('video-component');
component.dataset.views = '[]';
document.body.append(component);
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
window.remlaJsonLatestControl = {hasControl: true, handoffRequired: false, lifecycle: 'ready'};
await import('/PhotoElectricEffect/static/js/app.js');
const button = component.shadowRoot.querySelector('#take-snapshot');
const errors = [
    [{code: 'snapshot_limit', detail: 'Snapshot cooldown is active'}, 'required 10-second waiting period between taking pictures'],
    [{code: 'snapshot_limit', detail: 'Snapshot interruption budget is exhausted'}, '100 attempts per hour'],
    [{code: 'snapshot_limit', detail: 'A snapshot is already in progress'}, 'already in progress'],
    [{code: 'snapshot_unavailable', detail: 'private-token'}, 'capture could not be completed'],
    [{code: 'snapshot_limit', detail: 'private-token'}, 'Snapshot failed'],
];
let fetches = 0;
window.fetch = () => { fetches++; throw Error('must not download after command rejection'); };
for (const [error, expected] of errors) {
    window.remlaCommand = () => Promise.reject(error);
    button.click();
    await eventually(() => !button.disabled);
    assert(dialog.style.display === 'flex', `missing alert for ${error.code}`);
    assert(dialog.shadowRoot.textContent.includes(expected), `missing safe feedback for ${error.code}`);
    assert(!component.shadowRoot.textContent.includes(expected), 'no snapshot status in video component');
    assert(!dialog.shadowRoot.textContent.includes('private-token'), 'never render untrusted server detail');
    dialog.shadowRoot.querySelector('#close').click();
}
equal(fetches, 0);
""")

    def test_snapshot_rejection_after_handoff_does_not_alert_new_owner(self):
        self.run_browser("""
window.MediaMTXWebRTCReader = class { close() {} };
await import('/static/js/components/video.js');
await import('/static/js/components/alert-dialog.js');
const dialog = document.createElement('alert-dialog');
document.body.append(dialog);
const component = document.createElement('video-component');
component.dataset.views = '[]';
document.body.append(component);
await import('/PhotoElectricEffect/static/js/app.js');
const owner = {hasControl: true, handoffRequired: false, lifecycle: 'ready'};
const control = detail => window.dispatchEvent(new CustomEvent('remla:ownership-control', {detail}));
control(owner);
let rejectCommand;
window.remlaCommand = () => new Promise((resolve, reject) => { rejectCommand = reject; });
const alerts = [];
window.addEventListener('remla:alert', event => alerts.push(event.detail));
const button = component.shadowRoot.querySelector('#take-snapshot');
button.click();
assert(button.disabled, 'pending snapshot');
window.remlaJsonLatestControl = {handoffRequired: false};
window.dispatchEvent(new CustomEvent('remla:ownership-handoff'));
control(owner);
rejectCommand({code: 'snapshot_limit', detail: 'Snapshot cooldown is active'});
await eventually(() => !button.disabled);
equal(alerts, []);
assert(dialog.style.display !== 'flex', 'stale capture cannot alert a new owner');
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
