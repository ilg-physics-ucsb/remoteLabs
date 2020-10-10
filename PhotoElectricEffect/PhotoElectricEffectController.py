#!/usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet
import visa
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


outlets = labSettings["outlets"]
outletMap = labSettings["outletMap"]
electrometer_address = labSettings["electrometer_address"]
multimeter_address = labSettings["multimeter_address"]
refPoints = labSettings["refPoints"]
potBounds = labSettings["potBounds"]
filterBounds = labSettings["filterBounds"]

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
filterWheel = StepperI2C("Wheel", 1, bounds=filterBounds, refPoints=refPoints)

PEpdu = PDUOutlet("PEpdu", "128.111.18.80", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
PEpdu.login()

electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)

multimeter = Keithley2000Multimeter("Multimeter", visa_multimeter)

#This code is to release the motors at the start. I don't know why the labcontroller version doesn't work.
potentiometer.device.release()
filterWheel.device.release()

if args.reset:
    exp = Experiment("PhotoElectricEffect")
elif args.admin:
    exp = Experiment("PhotoElectricEffect", admin=True)
else:
    exp = Experiment("PhotoElectricEffect")
exp.add_device(PEpdu)
exp.add_device(potentiometer)
exp.add_device(filterWheel)
exp.add_device(electrometer)
exp.add_device(multimeter)
exp.set_socket_path(socket_path)
if not args.reset or not args.admin:
    exp.recallState()
exp.setup()