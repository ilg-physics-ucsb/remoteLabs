from labcontrol import Experiment, Stepper, Keithley6514Electrometer
import visa

resource_manager = visa.ResourceManager("@py")
visa_electrometer = resource_manager.open_resource(resource_manager.list_resources()[0], baud_rate=57600)
visa_electrometer.read_termination = "\r\n"
visa_electrometer.write_termination = "\r\n"

socket_path = "/tmp/uv4l.socket"

stepper1_pins = [17,18,27,22]
stepper1 = Stepper("Stp1", stepper1_pins)

electrometer = Keithley6514Electrometer("Electrometer", visa_electrometer)

exp = Experiment()
exp.add_device(stepper1)
exp.add_device(electrometer)
exp.set_socket_path(socket_path)
exp.setup()