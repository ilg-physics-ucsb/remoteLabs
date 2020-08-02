import time
import tplink_smarthome as tp
import dlipower
import RPistepper as stp
from adafruit_motorkit import MotorKit 
from adafruit_motor import stepper
import RPi.GPIO as gpio
import os
import subprocess
import busio
import board
from adafruit_bus_device.i2c_device import I2CDevice

gpio.setmode(gpio.BCM)

class BaseController(object):
    
    def cmd_handler(self, cmd, params):
        # Make the parser name, it should follow the naming convention <cmd>_parser. If there is no parser return None.
        parser = getattr(self, cmd+"_parser", None)

        # If parser exists, use it to parse the params.
        if parser is not None:
            params = parser(params)
        # If there is no parser print this statement for user. 
        else:
            print("No Parser Found. Will just pass params to command.")

        # No get the command method. If there isn't a method, it should through an AttributeError.
        method = getattr(self, cmd)
        
        if callable(method):
            method(params)
        

    def cleanup(self):
        pass
    
    def reset(self):
        pass

    def getState(self):
        return self.state
        
    def setState(self, state):
        self.state = state



class PDUOutlet(dlipower.PowerSwitch, BaseController):
    def __init__(self, name, hostname, userid, password, timeout=None, outlets=[1,2,3,4,5,6,7,8]):
        # self, userid=None, password=None, hostname=None, timeout=None, cycletime=None, retries=None, use_https=False
        super().__init__(hostname=hostname, userid=userid, password=password, timeout=timeout)
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.state = {1:"Off", 2:"Off", 3:"Off", 4:"Off", 5:"Off", 6:"Off", 7:"Off", 8:"Off" }
        self.outlets = outlets
        
    def on(self, outletNumber):
        super().on(outletNumber)
        self.state[outletNumber] = "On"

    def off(self, outletNumber):
        super().off(outletNumber)
        self.state[outletNumber] = "Off"

    def on_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "on")
        if int(params[0]) not in self.outlets:
            raise ArgumentError(self.name, "On", "Outlet "+ params[0], allowed="Outlets " + str(self.outlets))
        return int(params[0])
    
    def off_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "off")
        if int(params[0]) not in self.outlets:
            raise ArgumentError(self.name, "Off", "Outlet "+ params[0], allowed="Outlets " + str(self.outlets))
        return int(params[0])
    
    def reset(self):
        for outlet in self.outlets:
            self.off(outlet)


class Plug(tp.TPLinkSmartDevice, BaseController):
    def __init__(self, name, host, port=9999, timeout=10, connect=True):
        print(host, port, timeout, connect)
        super().__init__(host=host, port=port, connect=connect)
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.state = {"relayState": "OFF"}

    def setRelay(self,newRelay):
        print(newRelay)
        if newRelay=="OFF":
            super().send({'system': {'set_relay_state': {'state': 0}}})
        elif newRelay=="ON":
            super().send({'system': {'set_relay_state': {'state': 1}}})
        self.state["relayState"] = newRelay
        
    def setRelay_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "setRelay")
        return params[0]

    def cleanup(self):
        super().close()
    
    def reset(self):
        super().send({'system': {'set_relay_state': {'state': 0}}})
        super().close()


class StepperSimple(stp.Motor, BaseController):

    def __init__(self, name, pins, delay=0.02, refPoints={}):
        super().__init__(pins, delay)
        self.name = name
        self.device_type = "controller"
        self.refPoints = refPoints
        self.currentPosition = 0
        self.experiment = None
        self.state = {"position": self.currentPosition}
    
    def move(self, steps):
        print(steps)
        super().move(steps)
        super().release()
        self.currentPosition+=steps
        self.state["position"] = self.currentPosition
        self.device.release()
        
    def move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    def goto(self, position):
        print(position)
        endPoint=self.refPoints[position]   
        self.move(endPoint-self.currentPosition)

    def goto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]
        
    def cleanup(self):
        super().cleanup()
    
    def reset(self):
        super().reset()
    
# Initialise the first hat on the default address
# lowerBoard = MotorKit()
# Initialise the second hat on a different address
# upperBoard = MotorKit(address=0x61)

class StepperI2C(MotorKit, BaseController):

    def __init__(self, name, terminal, bounds, delay=0.02, refPoints={}, style="SINGLE",microsteps=8):
        if terminal > 2: 
            self.address=0x61
        else:
            self.address=0x60
        super().__init__(address=self.address, steppers_microsteps=microsteps)
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        
        self.terminal_options = {1: super().stepper1, 2: super().stepper2, 3:super().stepper1, 4:super().stepper2}
        self.refPoints = refPoints
        self.currentPosition = 0
        self.device = self.terminal_options[terminal]
        self.delay = delay
        self.lowerBound = bounds[0]
        self.upperBound = bounds[1]
        self.styles = {
            "SINGLE": stepper.SINGLE,
            "DOUBLE": stepper.DOUBLE,
            "MICROSTEP": stepper.MICROSTEP,
            "INTERLEAVE": stepper.INTERLEAVE
        }
        self.style = self.styles[style]

        self.state = {"position": self.currentPosition}
               
    def setup(self, style):
        pass

    def move(self, steps):
        print(steps)
        if steps >= 0:
            direction = stepper.BACKWARD
        else: 
            direction = stepper.FORWARD
        if self.currentPosition+steps <self.lowerBound and steps < 0:
            steps = self.lowerBound-self.currentPosition
        elif self.currentPosition+steps >self.upperBound and steps > 0:
            steps = self.upperBound-self.currentPosition
        for i in range(abs(steps)):
            self.device.onestep(style=self.style, direction=direction)
            time.sleep(self.delay)
        self.currentPosition+=steps
        self.state["position"] = self.currentPosition
        self.device.release()
        
    def move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    def goto(self, position):
        print(position)
        endPoint=self.refPoints[position]   
        self.move(endPoint-self.currentPosition)

    def goto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]
         
    
    def reset(self):
        self.move(-self.currentPosition)
        # pass
  

class Keithley6514Electrometer(BaseController):

    def __init__(self, name, visa_resource):
        self.name = name
        self.device_type = "measurement"
        self.experiment = None
        self.state = {"setting": ""}

        self.inst = visa_resource

    def press(self, params):
        self.inst.write("SYST:REM")
        self.inst.write(params)
        if params != "SYST:KEY 1":
            self.inst.write("SYST:LOC")

    def press_parser(self, params):
        print(">>", params)
        return params[0]
        
        
    
class Keithley2000Multimeter(BaseController): #copied unaltered from Electrometer on 200423

    def __init__(self, name, visa_resource):
        self.name = name
        self.device_type = "measurement"
        self.experiment = None
        self.state = {"setting": ""}

        self.inst = visa_resource
    

    def press(self, params):
        self.inst.write("SYST:REM")
        self.inst.write(params)
    
    def press_parser(self, params):
        print(">>", params)
        return params[0]
        

class ArduCamMultiCamera(BaseController):

    def __init__(self, name, videoNumber=0):
        self.name = name
        self.videoNumber = videoNumber
        self.device_type = "measurement"
        self.experiment = None
        self.state = {}

        # Define Pins
        # Board Pin 7 = BCM Pin 4 = Selection
        # Board Pin 11 = BCM Pin 17 = Enable 1
        # Board Pin 12 = BCM Pin 18 = Enable 2
        # See Arducam User Guide https://www.uctronics.com/download/Amazon/B0120.pdf
        self.selection = 4
        self.enable1 = 17
        self.enable2 = 18
        self.channels = [self.selection, self.enable1, self.enable2]
        gpio.setup(self.channels, gpio.OUT)



        self.cameraDict = {
            "a": (gpio.LOW, gpio.LOW, gpio.HIGH),
            "b": (gpio.HIGH, gpio.LOW, gpio.HIGH),
            "c": (gpio.LOW, gpio.HIGH, gpio.LOW),
            "d": (gpio.HIGH, gpio.HIGH, gpio.LOW),
            "off":(gpio.LOW, gpio.HIGH, gpio.HIGH)
        }

        self.camerai2c = {
            'a': "i2cset -y 11 0x70 0x00 0x04",
            'b': "i2cset -y 11 0x70 0x00 0x05",
            'c': "i2cset -y 11 0x70 0x00 0x06",
            'd': "i2cset -y 11 0x70 0x00 0x07",
        }

        # Set camera for A
        self.camera("a")

    def camera(self, param):
        #Param should be a, b, c, d, or off
        print("Switching to camera "+param)
        os.system(self.camerai2c[param])
        gpio.output(self.channels, self.cameraDict[param])
    
    def camera_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "camera")
        param = params[0].lower()
        if param not in self.cameraDict:
            raise ArgumentError(self.name, "camera", param, ["a", 'b', 'c', 'd', 'off'])
        return params[0].lower()
    
    def imageMod(self, params):
        imageControl = params[0]
        controlValue = params[1]
        subprocess.run('v4l2-ctl -d /dev/video{0} -c {1}={2}'.format(self.videoNumber, imageControl, controlValue),
                    shell=True)

    def imageMod_parser(self, params):
        if len(params) != 2:
            raise ArgumentNumberError(len(params), 2, "imageMod")
        return params

class ElectronicScreen(BaseController):

    def __init__(self, name, pin):
        self.pin = pin
        self.name = name
        self.state = "off"
        gpio.setup(self.pin, gpio.OUT)
    
    def on(self, params):
        gpio.output(self.pin, gpio.HIGH)
    
    def off(self, params):
        gpio.output(self.pin, gpio.LOW)

    def reset(self):
        gpio.output(self.pin, gpio.LOW)


class SingleGPIO(BaseController):

    def __init__(self, name, pin, initialState=False):
        self.pin = pin
        self.name = name
        gpio.setup(self.pin, gpio.OUT)
        if initialState:
            self.state = "off"
            gpio.output(self.pin, gpio.HIGH)
        else:
            self.state = "off"
            gpio.output(self.pin, gpio.LOW)
    
    def on(self, params):
        gpio.output(self.pin, gpio.HIGH)
    
    def off(self, params):
        gpio.output(self.pin, gpio.LOW)

    def reset(self):
        gpio.output(self.pin, gpio.LOW)

class CommandError(Exception):

    def __init__(self, command, *args):
        self.command = command
        if args:
            self.message = args[0]
        else:
            self.message = "No command named '{0}' found".format(self.command)
    
    def __str__(self):
        return "CommandError, {0}".format(self.message)

class ArgumentNumberError(Exception):
    def __init__(self, total_args, allowed, command=None):
        self.total_args = total_args
        self.allowed = allowed
        self.command = command
    
    def __str__(self):
        if self.command is None:
            return "ArgumentNumberError, received {0} when {1} was expected.".format(self.total_args, self.allowed)
        else:
            return "ArgumentNumberError, command '{0}' received {1} when {2} was expected.".format(self.command,
             self.total_args, self.allowed)

class ArgumentError(Exception):
    def __init__(self, device_name, command, received, allowed=None):
        self.device_name = device_name
        self.command = command
        self.allowed = allowed
        self.received = received
    
    def __str__(self):
        if self.allowed is None:
            return "ArgumentError, Device, {0}, can't process command argument {1} by command {2}.".format(self.device_name, self.received, self.command)
        else:
            return "ArgumentError, Argument {0}, is not one of the allowed commands, {1}, for device, {2}, running command {3}.".format(self.received, self.allowed, self.device_name, self.command)


