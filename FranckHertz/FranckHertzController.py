#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet, ArduCamMultiCamera
import pyvisa as visa
import argparse, os, json

parser = argparse.ArgumentParser(description="Used to select which mode to run in", prog="LabController")

parser.add_argument("-s", "--settings", required=True)
group = parser.add_mutually_exclusive_group()
group.add_argument("-r", "--reset", action="store_true")
group.add_argument("-a", "--admin", action="store_true")

args = parser.parse_args()

labSettingsPath = os.path.join("home","pi", "remoteLabs", "FranckHertz", args.settings)

with open(labSettingsPath, "r") as f:
    labSettings = json.load(f)


outlets                 = labSettings["outlets"]
outletMap               = labSettings["outletMap"]
electrometer_address    = labSettings["electrometer_address"]
filamentBounds          = labSettings["filamentBounds"]
ovenBounds              = labSettings["ovenBounds"]
VaBounds                = labSettings["VaBounds"]
VrBounds                = labSettings["VrBounds"]
ovenGearRatio               = labSettings["ovenGearRatio"]

videoNumber             = labSettings["videoNumber"]

if args.admin:
    bounds = (-1e6, 1e6)
    filamentBounds=bounds
    ovenBounds=bounds
    VaBounds=bounds
    VrBounds=bounds

resource_manager = visa.ResourceManager("@py")
visa_electrometer = resource_manager.open_resource('ASRL/dev/ttyUSB'+ str(electrometer_address) +'::INSTR', baud_rate=19200)
visa_electrometer.read_termination = "\r\n"
visa_electrometer.write_termination = "\r\n"

camera = ArduCamMultiCamera("Camera", videoNumber)

socket_path = "/tmp/uv4l.socket"

filament = StepperI2C("Filament", 1,bounds=filamentBounds, style="DOUBLE")
oven = StepperI2C("Oven", 2,bounds=ovenBounds, style="DOUBLE", gearRatio=ovenGearRatio)
Va = StepperI2C("Va", 3,bounds=VaBounds)
Vr = StepperI2C("Vr", 4,bounds=VrBounds)




FHpdu = PDUOutlet("FHpdu", "fhpdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
FHpdu.login()


electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)

#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
filament.device.release()
oven.device.release()
Va.device.release()
Vr.device.release()

if args.reset:
    exp = Experiment("FranckHertz", messenger=True)
elif args.admin:
    exp = Experiment("FranckHertz", admin=True)
else:
    exp=Experiment("FranckHertz", messenger=True)
exp.add_device(camera)
exp.add_device(FHpdu)
exp.add_device(oven)
# exp.add_device(OvenPower)
exp.add_device(filament)
# exp.add_device(FilamentPower)
# exp.add_device(PowerSupplyPower)
exp.add_device(Va)
exp.add_device(Vr)
exp.add_device(electrometer)
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

- created by Marlon Munoz
"""

exp.add_lock([camera])
exp.add_lock([FHpdu])
exp.add_lock([oven])
exp.add_lock([filament])
exp.add_lock([Va, Vr])
exp.add_lock([electrometer])

if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
        
        
    
