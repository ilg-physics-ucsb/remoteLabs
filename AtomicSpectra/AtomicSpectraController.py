#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO


camera = ArduCamMultiCamera("Camera", 1)

socket_path = "/tmp/uv4l.socket"

refPoints = {
    "h2":0,
    "a": -78,
    "b": int(-2*78),
    }

slit = StepperI2C("Slit", 1,bounds=(0,600), style="DOUBLE", delay=0.1)  
grating = StepperI2C("Grating", 2, bounds=(-450, 450), style="DOUBLE")
arm = StepperI2C("Arm", 3,bounds=(-21000,21000), style="DOUBLE")
carousel = StepperI2C("Carousel", 4,bounds=(-161, 5), style="DOUBLE", delay=0.1, refPoints=refPoints, microsteps=16)

ambient = SingleGPIO("Ambient", 5)


ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=[7])
ASDIpdu.login()



exp = Experiment("AtomicSpectra")
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(grating)
exp.add_device(slit)
exp.add_device(arm)
exp.add_device(carousel)
exp.add_device(ambient)
exp.set_socket_path(socket_path)
exp.recallState()
exp.setup()
        
    
