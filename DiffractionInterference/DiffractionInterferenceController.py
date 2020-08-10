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
refPointsMulti = labSettings["refPointsMulti"]

if args.admin:
    bounds = (-1e6, 1e6)
    multiSlitBounds = bounds
    singleSlitBounds = bounds
    stageBounds = bounds

camera = ArduCamMultiCamera("Camera", 1)


socket_path = "/tmp/uv4l.socket"



#this uses the broadcom pin numbering system
# screen = SingleGPIO("Screen", 26)
ambient = SingleGPIO("Ambient", ambientPin)

multiSlits = StepperI2C("MultiSlits", 1, bounds=multiSlitBounds, style="DOUBLE", delay=0.00004, refPoints=refPointsMulti)  #Multiple Slits
singleSlits = StepperI2C("SingleSlits", 2,bounds=singleSlitBounds, style="DOUBLE", delay=0.00004, refPoints=refPointsSingle) #Single Slits
stage = StepperI2C("Stage", 4, bounds=stageBounds, style="DOUBLE", delay=0.004) #Screen



ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=outlets, outletMap=outletMap)
ASDIpdu.login()

if args.reset:
    exp = Experiment("DiffractionInterference")
elif args.admin:
    exp = Experiment("DiffractionInterference", admin=True)
else:
    Experiment("DiffractionInterference")
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(multiSlits)
exp.add_device(singleSlits)
exp.add_device(stage)
exp.add_device(ambient)
exp.set_socket_path(socket_path)
if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
        
    