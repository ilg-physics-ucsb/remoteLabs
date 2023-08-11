#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, PDUOutlet, ArduCamMultiCamera, SingleGPIO, Multiplexer, AbsorberController
from labcontrol import S42CStepperMotor, FS5103RContinuousMotor, GeneralPWMServo
import pyvisa as visa
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
stageRefPoints  = labSettings["stageRefPoints"]
stageStepPin, stageDirPin, stageEnPin   = labSettings['stagePins']

magnetPin           = labSettings["magnetPin"]

actuatorPwmPin      = labSettings["actuatorPwmPin"]
actuatorLimitPin    = labSettings["actuatorLimitPin"]

initialState        = labSettings["initialState"]
holderMap           = labSettings["holderMap"]

multiplexerPins     = labSettings["multiplexerPins"]
inhibitorPin        = labSettings["inhibitorPin"]
multiplexerChannels = labSettings["multiplexerChannels"]
multiplexerDelay    = labSettings["multiplexerDelay"]

absorberDownTime = labSettings["absorberDownTime"]
absorberUpTime  = labSettings["absorberUpTime"]

if args.admin:
    stageBounds = (None, None)

camera = ArduCamMultiCamera("Camera", 0, i2cbus=11)

socket_path = "/tmp/uv4l.socket"
messenger_socket_path = "/tmp/remla.socket"

stage = S42CStepperMotor("Stage",
                        stageEnPin, 
                        stageStepPin, 
                        stageDirPin, 
                        bounds=stageBounds,
                        refPoints=stageRefPoints)

actuator = FS5103RContinuousMotor("actuator", actuatorPwmPin, actuatorLimitPin, _reversed=True)

magnet = GeneralPWMServo("magnet", magnetPin)

absorberController = AbsorberController("AbsorberController", stage, actuator, magnet, initialState, holderMap, downtime = absorberDownTime, uptime = absorberUpTime)

buttons = Multiplexer("Buttons", multiplexerPins, inhibitorPin, multiplexerChannels, delay=multiplexerDelay)
# Need to talk to PCS about getting GRpdu Setup
GRpdu = PDUOutlet("GRpdu", "grpdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
GRpdu.login()


#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
# stage.device.release()

if args.reset:
    exp = Experiment("GammaRadiation", messenger=True)
elif args.admin:
    exp = Experiment("GammaRadiation", admin=True)
else:
    exp=Experiment("GammaRadiation", messenger=True)

devices = [camera,
           stage,
           actuator,
           magnet,
           absorberController,
           buttons,
           GRpdu]

for device in devices:
    exp.add_device(device)

exp.add_lock(devices)

exp.set_socket_path(socket_path)
if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
