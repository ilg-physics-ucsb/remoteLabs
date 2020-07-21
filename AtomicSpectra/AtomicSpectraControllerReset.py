#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Plug, PDUOutlet, ArduCamMultiCamera, ElectronicScreen


camera = ArduCamMultiCamera("Camera", 1)

socket_path = "/tmp/uv4l.socket"


slit = StepperI2C("Slit", 1,bounds=(0,600), style="Double", delay=0.1)  
grating = StepperI2C("Grating", 2,bounds=(-450, 450))
arm = StepperI2C("Arm", 3,bounds=(-21000,21000))
carousel = StepperI2C("Carousel", 4,bounds=(-60, 13204), style="MICROSTEP", delay=0.00002)


ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=[6])
ASDIpdu.login()


exp = Experiment("AtomicSpectra")
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(grating)
exp.add_device(slit)
exp.add_device(arm)
exp.add_device(carousel)
exp.set_socket_path(socket_path)
exp.setup()
        
    