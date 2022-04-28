#!/usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet
import pyvisa as visa
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


outlets                 = labSettings["outlets"]
outletMap               = labSettings["outletMap"]
electrometer_address    = labSettings["electrometer_address"]
multimeter_address      = labSettings["multimeter_address"]
refPoints               = labSettings["refPoints"]
potBounds               = labSettings["potBounds"]
colorFilterBounds       = labSettings["colorFilterBounds"]
densityFilterBounds     = labSettings["densityFilterBounds"]

videoNumber             = labSettings["videoNumber"]

if args.admin:
    bounds = bounds = (-1e6, 1e6)
    filterBounds=bounds
    potBounds=bounds
    
resource_manager = visa.ResourceManager("@py")
visa_electrometer = resource_manager.open_resource('ASRL/dev/ttyUSB'+ str(electrometer_address) +'::INSTR', baud_rate=19200)
visa_electrometer.read_termination = "\r\n"
visa_electrometer.write_termination = "\r\n"

visa_multimeter = resource_manager.open_resource('ASRL/dev/ttyUSB'+ str(multimeter_address) + '::INSTR', baud_rate=19200) #not sure if USB# is unique 2004234
visa_multimeter.read_termination = "\r\n"
visa_multimeter.write_termination = "\r\n"

socket_path = "/tmp/uv4l.socket"

potentiometer = StepperI2C("Pot", 2, bounds=potBounds)
colorFilterWheel = StepperI2C("colorWheel", 1, bounds=colorFilterBounds, refPoints=refPoints)
densityFilterWheel = StepperI2C("densityWheel", 3, bounds=densityFilterBounds, refPoints=refPoints)

PEpdu = PDUOutlet("PEpdu", "128.111.18.80", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
PEpdu.login()

electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)

multimeter = Keithley2000Multimeter("Multimeter", visa_multimeter)

#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
potentiometer.device.release()
colorFilterWheel.device.release()
densityFilterWheel.device.release()

if args.reset:
    exp = Experiment("PhotoElectricEffect", messenger=True)
elif args.admin:
    exp = Experiment("PhotoElectricEffect", admin=True)
else:
    exp = Experiment("PhotoElectricEffect", messenger=True)
exp.add_device(PEpdu)
exp.add_device(potentiometer)
exp.add_device(colorFilterWheel)
exp.add_device(densityFilterWheel)
exp.add_device(electrometer)
exp.add_device(multimeter)
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

exp.add_lock([PEpdu])
exp.add_lock([potentiometer])
exp.add_lock([colorFilterWheel])
exp.add_lock([multimeter])
exp.add_lock([electrometer])
exp.add_lock([densityFilterWheel])

if not args.reset and not args.admin:
    exp.recallState()
exp.setup()