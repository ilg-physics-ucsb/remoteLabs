#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO


camera = ArduCamMultiCamera("Camera", 1)


socket_path = "/tmp/uv4l.socket"


Sstep = 670
Mstep = 975
Lstep = 1050
VariableLength=1800

refPointsSingle = {
    "SingleOpen": 0,
    "LineSlit": Sstep,
    "LittleHole": 2*Sstep+50,
    "BigHole": 3*Sstep+50,
    # Blank
    "A02": 3*Sstep + Mstep,
    "A04": 4*Sstep + Mstep,
    "A08": 5*Sstep + Mstep,
    "A16": 6*Sstep + Mstep,
    # Blank
    "VaryWidth": 6*Sstep + 2*Mstep,
    # Blank
    "Square": 6*Sstep + 2*Mstep + Lstep + VariableLength,
    "Hex": 7*Sstep + 2*Mstep + Lstep + VariableLength,
    "Dots": 8*Sstep + 2*Mstep + Lstep + VariableLength,
    "Holes": 9*Sstep + 2*Mstep + Lstep + VariableLength,
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

multiSlits = StepperI2C("MultiSlits", 1, bounds=(-12000,12000), style="DOUBLE", delay=0.00004, refPoints=refPointsMulti)  #Multiple Slits
singleSlits = StepperI2C("SingleSlits", 2,bounds=(-12000,12000), style="DOUBLE", delay=0.00004, refPoints=refPointsSingle) #Single Slits
stage = StepperI2C("Stage", 4, bounds=(-(39*250), 0), style="DOUBLE", delay=0.004) #Screen



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
exp.setup()
    