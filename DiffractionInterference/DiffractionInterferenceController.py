#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO


camera = ArduCamMultiCamera("Camera", 1)


socket_path = "/tmp/uv4l.socket"

refPointsSingle = {
    "SingleOpen": 0,
    "LineSlit": 0,
    "LittleHole": 0,
    "BigHole": 0,
    # Blank
    "A02": 0,
    "A04": 0,
    "A08": 0,
    "A16": 0,
    # Blank
    "VaryWidth": 0,
    # Blank
    "Square": 0,
    "Hex": 0,
    "Dots": 0,
    "Holes": 0,
}

refPointsMulti = {
    "MultiOpen": 0,
    "FarClose": 0,
    "WideThin": 0,
    "ThreeTwo": 0,
    # Blank
    "A04D25": 0,
    "A04D50": 0,
    "A08D25": 0,
    "A08D50": 0,
    # Blank
    "VarySpacing": 0,
    # Blank
    "TwoSlit": 0,
    "ThreeSlit": 0,
    "FourSlit": 0,
    "FiveSlit": 0,
}

#this uses the broadcom pin numbering system
screen = SingleGPIO("Screen", 26)
ambient = SingleGPIO("Ambient", 5)

multiSlits = StepperI2C("MultiSlits", 1, bounds=(-20000,20000), style="DOUBLE", refPoints=refPointsMulti)  #Multiple Slits
singleSlits = StepperI2C("SingleSlits", 2,bounds=(-20000,20000), style="DOUBLE", refPoints=refPointsSingle) #Single Slits
stage = StepperI2C("Stage", 3, bounds=(-20000, 200000), style="DOUBLE") #Screen



ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=[1])
ASDIpdu.login()



exp = Experiment("DiffractionInterference")
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(multiSlits)
exp.add_device(singleSlits)
exp.add_device(stage)
exp.add_device(ambient)
exp.add_device(screen)
exp.set_socket_path(socket_path)
exp.recallState()
exp.setup()
        
    