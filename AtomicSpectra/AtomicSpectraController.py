#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Plug, PDUOutlet, ArduCamMultiCamera, ElectronicScreen
import visa
import pickle


camera = ArduCamMultiCamera("Camera", 1)

socket_path = "/tmp/uv4l.socket"


slit = StepperI2C("Slit", 1,bounds=(-2100,2100))  
grating = StepperI2C("Grating", 2,bounds=(-2100,2100))
arm = StepperI2C("Arm", 3,bounds=(-2100,2100))
carousel = StepperI2C("Carousel", 4,bounds=(-2100,2100))


ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "5tgb567ujnb", 60)
ASDIpdu.login()
# OvenPower = Plug("OvenPower", "192.168.0.18")
# FilamentPower = Plug("FilamentPower", "192.168.0.19")
# PowerSupplyPower = Plug("PowerSupplyPower", "192.168.0.03")

# electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)
# ElectrometerPower = Plug("ElectrometerPower","192.168.0.20")


exp = Experiment("FranckHertz")
exp.add_device(camera)
exp.add_device(ASDIpdu)
exp.add_device(grating)
exp.add_device(screen)
exp.add_device(slit)
exp.add_device(arm)
exp.add_device(carousel)
# exp.add_device(OvenPower)
# exp.add_device(FilamentPower)
# exp.add_device(PowerSupplyPower)
exp.set_socket_path(socket_path)



while True:
    response = input("Has the apparatus been serviced and reset to the initial state since last shutdown? (y/N)")
    if response.lower() == "n" or response.lower() == "":
        exp.recallState()
        exp.setup()
    elif response.lower() == "y":
        exp.setup()
        
    