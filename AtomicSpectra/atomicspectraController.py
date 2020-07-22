#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet, ArduCamMultiCamera, SingleGPIO



camera = ArduCamMultiCamera("Camera", 1)

socket_path = "/tmp/uv4l.socket"



filament = StepperI2C("Filament", 1,bounds=(-2100,2100), style="DOUBLE")  
oven = StepperI2C("Oven", 2,bounds=(-2100,2100), style="DOUBLE")
Va = StepperI2C("Va", 3,bounds=(-2100,2100))
Vr = StepperI2C("Vr", 4,bounds=(-2100,2100))




# FHpdu = PDUOutlet("FHpdu", "fhpdu.inst.physics.ucsb.edu", "admin", "raspberry", 60)
# FHpdu.login()
# OvenPower = Plug("OvenPower", "192.168.0.18")
# FilamentPower = Plug("FilamentPower", "192.168.0.19")
# PowerSupplyPower = Plug("PowerSupplyPower", "192.168.0.03")

# electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)
# ElectrometerPower = Plug("ElectrometerPower","192.168.0.20")


exp = Experiment("FranckHertz")
exp.add_device(camera)
# exp.add_device(FHpdu)
exp.add_device(oven)
# exp.add_device(OvenPower)
exp.add_device(filament)
# exp.add_device(FilamentPower)
# exp.add_device(PowerSupplyPower)
exp.add_device(Va)
exp.add_device(Vr)
# exp.add_device(electrometer)
exp.set_socket_path(socket_path)


while True:
    response = input("Has the apparatus been serviced and reset to the initial state since last shutdown? (y/N)")
    if response.lower() == "n" or response.lower() == "":
        exp.recallState()
        exp.setup()
    elif response.lower() == "y":
        exp.setup()
        
    