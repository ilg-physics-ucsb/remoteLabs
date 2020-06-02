import time
import tplink_smarthome as tp
import dlipower
import RPistepper as stp
from adafruit_motorkit import MotorKit 
from adafruit_motor import stepper

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
    def __init__(self, name, hostname, userid, password):
        # self, userid=None, password=None, hostname=None, timeout=None, cycletime=None, retries=None, use_https=False
        super().__init__(hostname=hostname, userid=userid, password=password)
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.state = {1:"Off", 2:"Off", 3:"Off", 4:"Off", 5:"Off", 6:"Off", 7:"Off", 8:"Off" }
        
    def on(self, outletNumber):
        super().on(outletNumber)
        self.state[outletNumber] = "On"

    def off(self, outletNumber):
        super().off(outletNumber)
        self.state[outletNumber] = "Off"

    def on_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "on")
        return int(params[0])
    
    def off_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "off")
        return int(params[0])
    
    def reset(self):
        for outletNumber, state in self.state.items():
            self.off(outletNumber)


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

    def __init__(self, name, pins, delay=0.01, refPoints={}):
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

    def __init__(self, name, terminal, bounds, delay=0.01, refPoints={}):
        if terminal > 2: 
            self.address=0x61
        else:
            self.address=0x60
        super().__init__(address=self.address)
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        
        self.terminal_options = {1: super().stepper1, 2: super().stepper2, 3:super().stepper1, 4:super().stepper2}
        self.refPoints = refPoints
        self.currentPosition = 0
        self.device = self.terminal_options[terminal]
        self.delay = delay
        self.style = stepper.DOUBLE
        self.lowerBound = bounds[0]
        self.upperBound = bounds[1]

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
        # self.inst.write("SYST:LOC")

    def press_parser(self, params):
        print(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", params)
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
        print(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", params)
        return params[0]
        

   
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