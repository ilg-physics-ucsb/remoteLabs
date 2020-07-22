#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO


camera = ArduCamMultiCamera("Camera", 1)


socket_path = "/tmp/uv4l.socket"

#this uses the broadcom pin numbering system
screen = SingleGPIO("Screen", 26)
ambient = SingleGPIO("Ambient", 5)

filament = StepperI2C("Filament", 1, bounds=(-20000,20000), style="DOUBLE")  
Va = StepperI2C("Va", 2,bounds=(-20000,20000))
Vr = StepperI2C("Vr", 3,bounds=(-20000, 200000))




ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60, outlets=[1])
ASDIpdu.login()



exp = Experiment("DiffractionInterference")
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(filament)
exp.add_device(Va)
exp.add_device(Vr)
exp.set_socket_path(socket_path)
exp.recallState()
exp.setup()
        
        
    