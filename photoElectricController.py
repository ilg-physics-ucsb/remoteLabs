from labcontrol import Experiment, StepperI2C, Keithley6514Electrometer, Keithley2000Multimeter, Plug, PDUOutlet
import visa
import pickle

resource_manager = visa.ResourceManager("@py")
visa_electrometer = resource_manager.open_resource('ASRL/dev/ttyUSB1::INSTR', baud_rate=57600)
visa_electrometer.read_termination = "\r\n"
visa_electrometer.write_termination = "\r\n"

visa_multimeter = resource_manager.open_resource('ASRL/dev/ttyUSB0::INSTR', baud_rate=19200) #not sure if USB# is unique 2004234
visa_multimeter.read_termination = "\r\n"
visa_multimeter.write_termination = "\r\n"

socket_path = "/tmp/uv4l.socket"

pot_pins = [5,6,12,13]
wheel_pins = [17,18,27,22]  #this uses the broadcom pin numbering system
refPoints = {
    "0deg":0,
    "60deg":270,
    "120deg":540,
    "180deg":810
    }
    

potentiometer = StepperI2C("Pot", 2,bounds=(0,2100))

filterWheel = StepperI2C("Wheel", 1, bounds=(0,810), refPoints=refPoints)

# ambientLight = Plug("ambientLight", "192.168.0.3")
ambientLight = PDUOutlet("ambientLight", "photoelecpdu.inst.physics.ucsb.edu", "admin", "raspberry")
ambientLight.login()
print(ambientLight.verify())
# HgNeLamp = Plug("HgNeLamp", "192.168.0.18")

electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)
# electrometerPower = Plug("electrometerPower","192.168.0.19")
multimeter = Keithley2000Multimeter("Multimeter", visa_multimeter)
# multimeterPower = Plug("multimeterPower","192.168.0.20")

# code here (that could eventually become its own object) that queries the person launching the program
# whether the instrument has been serviced and reinitialized since last shutdown? (y/n) (default y)

exp = Experiment("PhotoElectric")
exp.add_device(ambientLight)
# exp.add_device(HgNeLamp)
exp.add_device(potentiometer)
exp.add_device(filterWheel)
exp.add_device(electrometer)
exp.add_device(multimeter)
# exp.add_device(electrometerPower)
# exp.add_device(multimeterPower)
exp.set_socket_path(socket_path)


while True:
    response = input("Has the apparatus been serviced and reset to the initial state since last shutdown? (y/N)")
    if response.lower() == "n" or response.lower() == "":
        exp.recallState()
        exp.setup()
    elif response.lower() == "y":
        exp.setup()
        
    