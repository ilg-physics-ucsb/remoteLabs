#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO
import argparse, os, json

parser = argparse.ArgumentParser(description="Used to select which mode to run in", prog="LabController")

parser.add_argument("-s", "--settings", required=True)
group = parser.add_mutually_exclusive_group()
group.add_argument("-r", "--reset", action="store_true")
group.add_argument("-a", "--admin", action="store_true")

args = parser.parse_args()

labSettingsPath = os.path.join("home","pi", "remoteLabs", "PhotoElectricEffect", args.settings)

with open(labSettingsPath, "r") as f:
    labSettings = json.load(f)


outlets         = labSettings["outlets"]
outletMap       = labSettings["outletMap"]

#Single slits spacing ~670
#Single slit medium is about 975 (between groups)
#Single slit large is 1050 (from variable to next group)
#Single slit variable is 1725 long

#Multi slit spacing is 645
#Multi slit medium spacing is 1000 (between groups) 



ambientPin      = labSettings["ambientPin"]

multiSlitBounds = labSettings["multiSlitBounds"]
singleSlitBounds= labSettings["singleSlitBounds"]
stageBounds     = labSettings["stageBounds"]
refPointsSingle = labSettings["refPointsSingle"]
refPointsMulti  = labSettings["refPointsMulti"]

stageDelay      = labSettings["stageDelay"]
multiSlitDelay  = labSettings["multiSlitDelay"]
singleSlitDelay = labSettings["singleSlitDelay"]

stageTerminal   = labSettings["stageTerminal"]

videoNumber     = labSettings["videoNumber"]

if args.admin:
    bounds = (-1e6, 1e6)
    multiSlitBounds = bounds
    singleSlitBounds = bounds
    stageBounds = bounds


defaultCameraSettings = labSettings["defaultCameraSettings"]
camera = ArduCamMultiCamera("Camera", videoNumber, defaultSettings=defaultCameraSettings)


socket_path = "/tmp/uv4l.socket"



#this uses the broadcom pin numbering system
# screen = SingleGPIO("Screen", 26)
ambient = SingleGPIO("Ambient", ambientPin)

multiSlits = StepperI2C("MultiSlits", 1, bounds=multiSlitBounds, style="MICROSTEP", delay=multiSlitDelay, refPoints=refPointsMulti)  #Multiple Slits
singleSlits = StepperI2C("SingleSlits", 2,bounds=singleSlitBounds, style="MICROSTEP", delay=singleSlitDelay, refPoints=refPointsSingle) #Single Slits
stage = StepperI2C("Stage", stageTerminal, bounds=stageBounds, style="DOUBLE", delay=stageDelay) #Screen

# Delay Old: delay=0.00004
# Style Old: style="DOUBLE"
# StepperI2C 'style' options are: 'SINGLE' 'DOUBLE' 'INTERLEAVE' 'MICROSTEP'
# Default is 8 microsteps
# Just a test note


ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
ASDIpdu.login()

#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
multiSlits.device.release()
singleSlits.device.release()
stage.device.release()

if args.reset:
    exp = Experiment("DiffractionInterference", messenger=True)
elif args.admin:
    exp = Experiment("DiffractionInterference", admin=True)
else:
    exp = Experiment("DiffractionInterference", messenger=True)
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(multiSlits)
exp.add_device(singleSlits)
exp.add_device(stage)
exp.add_device(ambient)
exp.set_socket_path(socket_path)


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
exp.add_lock([ASDIpdu])
exp.add_lock([multiSlits])
exp.add_lock([singleSlits])
exp.add_lock([stage])
exp.add_lock([ambient])

if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
        
    
