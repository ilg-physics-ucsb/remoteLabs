#!/usr/bin/env python3
from labcontrol import Experiment, ArduCamMultiCamera

camera = ArduCamMultiCamera("Camera")

socket_path = "/tmp/uv4l.socket"

exp = Experiment("Test")
exp.add_device(camera)
exp.set_socket_path(socket_path)
exp.setup()