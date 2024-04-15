#! /usr/bin/env python3
from asyncore import read
from labcontrol import Experiment, StepperI2C, S42CStepperMotor, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO, LimitSwitch
import argparse, os, json

parser = argparse.ArgumentParser(description="Used to select which mode to run in", prog="LabController")

parser.add_argument("-s", "--settings", required=True)
group = parser.add_mutually_exclusive_group()
group.add_argument("-r", "--reset", action="store_true")
group.add_argument("-a", "--admin", action="store_true")

args = parser.parse_args()

labSettingsPath = os.path.join("home","pi", "remoteLabs", "AtomicSpectra", args.settings)

with open(labSettingsPath, "r") as f:
    labSettings = json.load(f)

outlets         = labSettings["outlets"]
outletMap       = labSettings["outletMap"]
refPoints       = labSettings["refPoints"]

ambientPin      = labSettings["ambientPin"] # GPIO 5
carouselEN, carouselSTEP, carouselDIR   = labSettings["carouselPins"] # [EN, STEP, DIR]
armEN,      armSTEP,      armDIR        = labSettings["armPins"] # [EN, STEP, DIR]

slitBounds      = labSettings["slitBounds"]
gratingBounds   = labSettings["gratingBounds"]
armBounds       = labSettings["armBounds"]
carouselBounds  = labSettings["carouselBounds"]

videoNumber     = labSettings["videoNumber"]

if args.admin:
    bounds = (-1e6, 1e6)
    slitBounds = bounds
    gratingBounds = bounds
    armBounds = bounds
    carouselBounds = bounds

defaultCameraSettings = labSettings["defaultCameraSettings"]
camera = ArduCamMultiCamera("Camera", videoNumber, defaultSettings=defaultCameraSettings)
socket_path = "/tmp/uv4l.socket"

slit = StepperI2C("Slit", 1,bounds=slitBounds, style="DOUBLE", delay=0.001)  
grating = StepperI2C("Grating", 2, bounds=gratingBounds, style="DOUBLE")

arm = S42CStepperMotor("Arm", armEN, armSTEP, armDIR, bounds=armBounds, stepDelay = 0.004)
carousel = S42CStepperMotor("Carousel", carouselEN, carouselSTEP, carouselDIR, bounds=carouselBounds, refPoints=refPoints, stepDelay = 0.002)

ambient = SingleGPIO("Ambient", ambientPin)

ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
ASDIpdu.login()

#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
slit.device.release()
grating.device.release()

if args.reset:
    exp = Experiment("AtomicSpectra", messenger=True)
elif args.admin:
    exp = Experiment("AtomicSpectra", admin=True)
else:
    exp = Experiment("AtomicSpectra", messenger=True)
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(grating)
exp.add_device(slit)
exp.add_device(arm)
exp.add_device(carousel)
exp.add_device(ambient)

"""
add_lock function is defined in line 60 of experiment.py

This function must take in an iterable and allows multiprocessing by placing a lock on a single or multiple devices. Locking devices
disables devices that share that lock from being ran at the same time. When a command is sent to a device, the device aquires the lock,
disabling all other devices (including itself) executing any commands. Instead these commands are put into a queue and executed in
first in first out order as soon as the original device finishes executing and releases the lock.

If two devices should not be ran at the sametime, put both devices into an iterable (i.e. [device1, device2]) to create a lock
both devices share. If a device can be ran at the same time as every other device, you must still give it its own lock by placing it in
an iterable (i.e. ([device1])) to enable multiprocessing and to allow multiple commands to be queued for that device. 


"""

exp.add_lock([camera])
exp.add_lock([ASDIpdu, carousel])
exp.add_lock([grating])
exp.add_lock([slit])
exp.add_lock([arm])

exp.add_lock([ambient])

exp.set_socket_path(socket_path)
if not args.reset and not args.admin:
    exp.recallState()
exp.setup()