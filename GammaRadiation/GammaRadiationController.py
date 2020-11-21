#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, PDUOutlet, ArduCamMultiCamera, DCMotorI2C, SingleGPIO, PushButton
import visa
import argparse, os, json

parser = argparse.ArgumentParser(description="Used to select which mode to run in", prog="LabController")

parser.add_argument("-s", "--settings", required=True)
group = parser.add_mutually_exclusive_group()
group.add_argument("-r", "--reset", action="store_true")
group.add_argument("-a", "--admin", action="store_true")

args = parser.parse_args()

labSettingsPath = os.path.join("home","pi", "remoteLabs", "GammaRadiation", args.settings)

with open(labSettingsPath, "r") as f:
    labSettings = json.load(f)

# Raffi make these settings match what is needed in the settings file
outlets         = labSettings["outlets"]
outletMap       = labSettings["outletMap"]
stageBounds     = labSettings["stageBounds"]
magnetPin       = labSettings["electroMagnetPin"]

countButtonPin  = labSettings["countButtonPin"]
stopButtonPin   = labSettings["stopButtonPin"]
hvButtonPin     = labSettings["hvButtonPin"]
timeButtonPin   = labSettings["timeButtonPin"]
upButtonPin     = labSettings["upButtonPin"]
downButtonPin   = labSettings["downButtonPin"]

if args.admin:
    bounds = (-1e6, 1e6)
    stageBounds=bounds

camera = ArduCamMultiCamera("Camera", 1)

socket_path = "/tmp/uv4l.socket"


stage = StepperI2C("Stage", 1, bounds=stageBounds, style="DOUBLE", delay=0.004)

actuator = DCMotorI2C("Actuator", 3)

magnet = SingleGPIO("Magnet", magnetPin)

countButton = PushButton("CountButton", countButtonPin)
stopButton  = PushButton("StopButton", stopButtonPin)
hvButton    = PushButton("HVButton", hvButtonPin)
timeButton  = PushButton("TimeButton", timeButtonPin)
upButton    = PushButton("UpButton", upButtonPin)
downButton  = PushButton("DownButton", downButtonPin)


# Need to talk to PCS about getting GRpdu Setup 
# GRpdu = PDUOutlet("GRpdu", "grpdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
# GRpdu.login()


#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
stage.device.release()

if args.reset:
    exp = Experiment("GammaRadiation")
elif args.admin:
    exp = Experiment("GammaRadiation", admin=True)
else:
    exp=Experiment("GammaRadiation")
exp.add_device(camera)
exp.add_device(stage)
exp.add_device(actuator)
exp.add_device(magnet)
exp.add_device(countButton)
exp.add_device(stopButton)
exp.add_device(hvButton)
exp.add_device(timeButton)
exp.add_device(upButton)
exp.add_device(downButton)


exp.set_socket_path(socket_path)
if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
        
        
    
