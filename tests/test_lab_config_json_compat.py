"""Hardware-free guards for the labs used by the restyled JSON frontend."""

from collections import Counter
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


def block(text, parent, name):
    """Return an indented YAML block without parsing or resolving secrets."""
    parent_text = text.split(f"\n{parent}:\n", 1)[1]
    parent_text = parent_text.split("\nlocks:\n", 1)[0] if parent == "devices" else parent_text
    lines = parent_text.splitlines()
    start = lines.index(f"  {name}:") + 1
    end = next((i for i in range(start, len(lines))
                if lines[i] and not lines[i].startswith(("    ", "      "))), len(lines))
    return "\n".join(lines[start:end])


class LabConfigJsonCompatibilityTests(unittest.TestCase):
    def test_photo1_named_power_routes_and_shared_lock(self):
        text = "\n" + (ROOT / "photo1.yml").read_text(encoding="utf-8")
        for consumer in ("HgNeLamp", "Ambient", "Electrometer", "Multimeter"):
            with self.subTest(consumer=consumer):
                body = block(text, "devices", consumer)
                self.assertIn(f"provider: PEpdu\n      outlet: {consumer}", body)
        self.assertIn("type: PowerConsumer", block(text, "devices", "HgNeLamp"))
        self.assertIn("type: PowerConsumer", block(text, "devices", "Ambient"))
        self.assertEqual(set(re.findall(r"(?m)^    - (\w+)$", block(text, "locks", "pdu"))),
                         {"PEpdu", "HgNeLamp", "Ambient", "Electrometer", "Multimeter"})

    def test_diffrac2_named_power_routes_and_shared_lock(self):
        text = "\n" + (ROOT / "diffrac2.yml").read_text(encoding="utf-8")
        for consumer in ("Laser", "Screen"):
            with self.subTest(consumer=consumer):
                body = block(text, "devices", consumer)
                self.assertIn("type: PowerConsumer", body)
                self.assertIn(f"provider: ASDIpdu\n      outlet: {consumer}", body)
        self.assertEqual(set(re.findall(r"(?m)^    - (\w+)$", block(text, "locks", "pdu"))),
                         {"ASDIpdu", "Laser", "Screen"})

    def test_photo2_named_power_routes_use_its_original_outlets(self):
        text = "\n" + (ROOT / "photo2.yml").read_text(encoding="utf-8")
        for device, outlet in (("Electrometer", 1), ("Multimeter", 2),
                               ("HgNeLamp", 3), ("Ambient", 4)):
            with self.subTest(device=device):
                body = block(text, "devices", device)
                self.assertIn(f"provider: PEpdu\n      outlet: {device}", body)
                self.assertTrue(f"      {device}: {outlet}" in block(text, "devices", "PEpdu"),
                                "Existing photo2 PDU outlet must be preserved")
        for device in ("HgNeLamp", "Ambient"):
            self.assertIn("type: PowerConsumer", block(text, "devices", device))
        self.assertEqual(set(re.findall(r"(?m)^    - (\w+)$", block(text, "locks", "pdu"))),
                         {"PEpdu", "Electrometer", "Multimeter", "HgNeLamp", "Ambient"})

    def test_diffrac1_named_power_routes_use_its_original_outlets(self):
        text = "\n" + (ROOT / "diffrac1.yml").read_text(encoding="utf-8")
        for device, outlet in (("Laser", 1), ("Screen", 2)):
            with self.subTest(device=device):
                body = block(text, "devices", device)
                self.assertIn("type: PowerConsumer", body)
                self.assertIn(f"provider: ASDIpdu\n      outlet: {device}", body)
                self.assertTrue(f"      {device}: {outlet}" in block(text, "devices", "ASDIpdu"),
                                "Existing diffrac1 PDU outlet must be preserved")
        self.assertEqual(set(re.findall(r"(?m)^    - (\w+)$", block(text, "locks", "pdu"))),
                         {"ASDIpdu", "Laser", "Screen"})

    def test_paired_labs_have_different_power_outlet_numbers(self):
        for prefix, provider in (("diffrac", "ASDIpdu"), ("photo", "PEpdu")):
            with self.subTest(prefix=prefix):
                outlet_sets = []
                for number in (1, 2):
                    text = "\n" + (ROOT / f"{prefix}{number}.yml").read_text(encoding="utf-8")
                    pdu = block(text, "devices", provider)
                    outlet_map = pdu.split("    outletMap:\n", 1)[1]
                    outlet_sets.append(set(int(n) for n in re.findall(r"(?m)^      \w+: (\d+)$", outlet_map)))
                self.assertTrue(all(outlet_sets) and outlet_sets[0].isdisjoint(outlet_sets[1]),
                                "Paired labs must retain distinct PDU outlets")

    def test_all_four_related_configs_use_named_secrets(self):
        for name in ("diffrac1.yml", "diffrac2.yml", "photo1.yml", "photo2.yml"):
            with self.subTest(name=name):
                text = (ROOT / name).read_text(encoding="utf-8")
                values = re.findall(r"(?m)^    password:\s*(.*?)\s*$", text)
                self.assertTrue(values, "PDU password reference is missing")
                self.assertTrue(all(re.fullmatch(r"\$\{secret:[a-z][a-z0-9-]*\}", v)
                                    for v in values), "PDU password must be a named secret")

    def test_each_device_has_exactly_one_lock(self):
        for name in ("diffrac1.yml", "diffrac2.yml", "photo1.yml", "photo2.yml"):
            with self.subTest(name=name):
                text = "\n" + (ROOT / name).read_text(encoding="utf-8")
                device_names = set(re.findall(r"(?m)^  (\w+):$", text.split("\nlocks:\n", 1)[0]))
                assignments = Counter(re.findall(r"(?m)^    - (\w+)$", text.split("\nlocks:\n", 1)[1]))
                self.assertEqual(assignments, Counter({device: 1 for device in device_names}))


if __name__ == "__main__":
    unittest.main()
