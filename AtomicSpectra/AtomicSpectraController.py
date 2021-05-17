#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO, LimitSwitch
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

leftSwitchPin   = labSettings["leftSwitchPin"]
rightSwitchPin  = labSettings["rightSwitchPin"]
homeSwitchPin   = labSettings["homeSwitchPin"]
ambientPin      = labSettings["ambientPin"]

slitBounds      = labSettings["slitBounds"]
gratingBounds   = labSettings["gratingBounds"]
armBounds       = labSettings["armBounds"]
carouselBounds  = labSettings["carouselBounds"]

limitBounce     = labSettings["limitBounce"]
homeOvershoot   = labSettings["homeOvershoot"]

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

leftSwitch = LimitSwitch("LeftSwitch", leftSwitchPin)
rightSwitch = LimitSwitch("RightSwitch", rightSwitchPin)
homeSwitch = LimitSwitch("HomeSwitch", homeSwitchPin)

def leftSwitchHit(motor, steps):
    print("Left Switch Hit")
    motor.currentPosition += steps
    motor.adminMove(-limitBounce)

def rightSwitchHit(motor, steps):
    print("Right Switch Hit")
    motor.currentPosition += steps
    motor.adminMove(limitBounce)

def homing(motor):
    print("Home switch hit.")
    homeSwitch = motor.move(20000)
    print("Here I am at left switch")
    print(homeSwitch)
    if homeSwitch is True:
        motor.adminMove(homeOvershoot)
    else:
        print("Moving Towards home.")
        motor.homeMove(stepLimit=15000)
    motor.currentPosition = 0

leftSwitch.switchAction = leftSwitchHit
rightSwitch.switchAction = rightSwitchHit

slit = StepperI2C("Slit", 1,bounds=slitBounds, style="DOUBLE", delay=0.1)  
grating = StepperI2C("Grating", 2, bounds=gratingBounds, style="DOUBLE")
arm = StepperI2C("Arm", 3,bounds=armBounds, style="INTERLEAVE", limitSwitches=[leftSwitch, rightSwitch], homeSwitch=homeSwitch, delay=0.0001)
arm.customHome = homing
carousel = StepperI2C("Carousel", 4,bounds=carouselBounds, style="MICROSTEP", delay=0.0001, refPoints=refPoints, microsteps=16)

ambient = SingleGPIO("Ambient", ambientPin)


ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
ASDIpdu.login()

#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
slit.device.release()
grating.device.release()
arm.device.release()
carousel.device.release()

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
exp.set_socket_path(socket_path)
if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
        
    
