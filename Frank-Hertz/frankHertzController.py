#! /usr/bin/env python3
from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet
import visa
import pickle

resource_manager = visa.ResourceManager("@py")
visa_electrometer = resource_manager.open_resource('ASRL/dev/ttyUSB1::INSTR', baud_rate=57600)
visa_electrometer.read_termination = "\r\n"
visa_electrometer.write_termination = "\r\n"

# visa_multimeter = resource_manager.open_resource('ASRL/dev/ttyUSB0::INSTR', baud_rate=19200) #not sure if USB# is unique 2004234
# visa_multimeter.read_termination = "\r\n"
# visa_multimeter.write_termination = "\r\n"

socket_path = "/tmp/uv4l.socket"

#this uses the broadcom pin numbering system
# oven_pins = [5,6,12,13]
# filament_pins = [5,6,12,13]
# Va_pins = [5,6,12,13]
# Vr_pins = [5,6,12,13]

    

oven = StepperI2C("Oven", 1,bounds=(0,2100))
filament = StepperI2C("Filament", 2,bounds=(0,2100))
Va = StepperI2C("Va", 3,bounds=(0,2100))
Vr = StepperI2C("Vr", 4,bounds=(0,2100))

PEpdu = PDUOutlet("PEpdu", "photoelecpdu.inst.physics.ucsb.edu", "admin", "raspberry")
PEpdu.login()
# Oven = Plug("OvenPower", "192.168.0.X")
# Filament = Plug("FilamentPower", "192.168.0.X")
# PowerSupply = Plug("PowerSupplyPower", "192.168.0.X")

electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)
# electrometerPower = Plug("electrometerPower","192.168.0.19")


exp = Experiment("FranckHertz")
exp.add_device(PEpdu)
exp.add_device(oven)
exp.add_device(filament)
exp.add_device(Va)
exp.add_device(Vr)
exp.add_device(electrometer)
exp.set_socket_path(socket_path)


while True:
    response = input("Has the apparatus been serviced and reset to the initial state since last shutdown? (y/N)")
    if response.lower() == "n" or response.lower() == "":
        exp.recallState()
        exp.setup()
    elif response.lower() == "y":
        exp.setup()
        
    