from labcontrol import Experiment, Stepper, Keithley6514Electrometer, Keithley2000Multimeter#, Relay
import visa

resource_manager = visa.ResourceManager("@py")
visa_electrometer = resource_manager.open_resource('ASRL/dev/ttyUSB0::INSTR', baud_rate=57600)
visa_electrometer.read_termination = "\r\n"
visa_electrometer.write_termination = "\r\n"

visa_multimeter = resource_manager.open_resource('ASRL/dev/ttyUSB1::INSTR', baud_rate=19200) #not sure if USB# is unique 2004234
visa_multimeter.read_termination = "\r\n"
visa_multimeter.write_termination = "\r\n"

socket_path = "/tmp/uv4l.socket"

pot_pins = [17,18,27,22]  #this uses the broadcom pin numbering system
wheel_pins = [5,6,12,13]
potentiometer = Stepper("Pot", pot_pins) 
filterWheel = Stepper("Wheel", wheel_pins)

# lamp_pins = [?,?,?]
# lamp = Relay("Lamp",lamp_pins)

electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)
multimeter = Keithley2000Multimeter("Multimeter", visa_multimeter)

exp = Experiment()
#exp.add_device(lamp)
exp.add_device(potentiometer)
exp.add_device(filterWheel)
exp.add_device(electrometer)
exp.add_device(multimeter)
exp.set_socket_path(socket_path)
exp.setup()