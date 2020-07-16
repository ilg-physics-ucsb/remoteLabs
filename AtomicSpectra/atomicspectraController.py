#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet, ArduCamMultiCamera
import visa
import pickle

# resource_manager = visa.ResourceManager("@py")
# visa_electrometer = resource_manager.open_resource('ASRL/dev/ttyUSB0::INSTR', baud_rate=57600)
# visa_electrometer.read_termination = "\r\n"
# visa_electrometer.write_termination = "\r\n"

# visa_multimeter = resource_manager.open_resource('ASRL/dev/ttyUSB0::INSTR', baud_rate=19200) #not sure if USB# is unique 2004234
# visa_multimeter.read_termination = "\r\n"
# visa_multimeter.write_termination = "\r\n"

camera = ArduCamMultiCamera("Camera", 1)
# camera.camera("b")

socket_path = "/tmp/uv4l.socket"

#this uses the broadcom pin numbering system
# oven_pins = [5,6,12,13]
# filament_pins = [5,6,12,13]
# Va_pins = [5,6,12,13]
# Vr_pins = [5,6,12,13]

slit = StepperI2C("Slit", 1,bounds=(-2100,2100), style="DOUBLE")  
grating = StepperI2C("Grating", 2,bounds=(-2100,2100), style="DOUBLE")
arm = StepperI2C("Arm", 3,bounds=(-2100,2100))
carousel = StepperI2C("Carousel", 4,bounds=(-2100,2100))




ASDIpdu = PDUOutlet("ASDIpdu", "asdipdu.inst.physics.ucsb.edu", "admin", "raspberry", 60)
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
# exp.add_device(OvenPower)
exp.add_device(slit)
# exp.add_device(FilamentPower)
# exp.add_device(PowerSupplyPower)
exp.add_device(arm)
exp.add_device(carousel)
# exp.add_device(electrometer)
exp.set_socket_path(socket_path)


while True:
    response = input("Has the apparatus been serviced and reset to the initial state since last shutdown? (y/N)")
    if response.lower() == "n" or response.lower() == "":
        exp.recallState()
        exp.setup()
    elif response.lower() == "y":
        exp.setup()
        
    