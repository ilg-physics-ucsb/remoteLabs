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
    exp = Experiment("FranckHertz", messenger=False)
elif args.admin:
    exp = Experiment("FranckHertz", admin=False)
else:
    exp=Experiment("FranckHertz", messenger=False)
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
if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
        
        
    
