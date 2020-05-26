import RPistepper as stp
from adafruit_motorkit import MotorKit 
from adafruit_motor import stepper
import time
import tplink_smarthome as tp
import dlipower

class BaseController(object):
    
    def __init__(self, commands=[]):
        self.commands = commands
    
    def cmd_handler(self, cmd, *params):
        pass

class PDUoutlet(dlipower.PowerSwitch(hostname, userid)):
    def __init__(self, name, host, port=9999, timeout=10, connect=True):
        # self, userid=None, password=None, hostname=None, timeout=None, cycletime=None, retries=None, use_https=False
        print(host, port, timeout, connect)
        super().__init__(host=host, port=port, connect=connect)
        self.commands={
            "state":{"method": self.setRelay, 
                     "parser": self.__setRelay_parser
                    }
                      }   
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.state = {"relayState": "OFF"}

        
    def cmd_handler(self, cmd, params):
        if cmd not in self.commands:
            raise CommandError(cmd)
        parsed_argument = self.commands[cmd]["parser"](params)
        self.commands[cmd]["method"](parsed_argument)
    
    def setRelay(self,newRelay):
        print(newRelay)
        if newRelay=="OFF":
            super().send({'system': {'set_relay_state': {'state': 0}}})
        elif newRelay=="ON":
            super().send({'system': {'set_relay_state': {'state': 1}}})
        self.state["relayState"] = newRelay
        
    def __setRelay_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "setRelay")
        return params[0]

    def getState(self):
        return self.state
        
    def setState(self, state):
        self.state = state

    def cleanup(self):
        super().close()
    
    def reset(self):
        super().send({'system': {'set_relay_state': {'state': 0}}})
        super().close()

class Plug(tp.TPLinkSmartDevice):
    def __init__(self, name, host, port=9999, timeout=10, connect=True):
        print(host, port, timeout, connect)
        super().__init__(host=host, port=port, connect=connect)
        self.commands={
            "state":{"method": self.setRelay, 
                     "parser": self.__setRelay_parser
                    }
                      }   
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.state = {"relayState": "OFF"}

        
    def cmd_handler(self, cmd, params):
        if cmd not in self.commands:
            raise CommandError(cmd)
        parsed_argument = self.commands[cmd]["parser"](params)
        self.commands[cmd]["method"](parsed_argument)
    
    def setRelay(self,newRelay):
        print(newRelay)
        if newRelay=="OFF":
            super().send({'system': {'set_relay_state': {'state': 0}}})
        elif newRelay=="ON":
            super().send({'system': {'set_relay_state': {'state': 1}}})
        self.state["relayState"] = newRelay
        
    def __setRelay_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "setRelay")
        return params[0]

    def getState(self):
        return self.state
        
    def setState(self, state):
        self.state = state

    def cleanup(self):
        super().close()
    
    def reset(self):
        super().send({'system': {'set_relay_state': {'state': 0}}})
        super().close()


class StepperSimple(stp.Motor):

    def __init__(self, name, pins, delay=0.01, refPoints={}):
        super().__init__(pins, delay)
        self.commands = {
            "move": {"method": self.move, 
                     "parser": self.__move_parser
                    },
            "goto": {"method": self.goto, 
                     "parser": self.__goto_parser
                    }
                        }
        self.name = name
        self.device_type = "controller"
        self.refPoints = refPoints
        self.currentPosition = 0
        self.experiment = None
        self.state = {"position": self.currentPosition}
    
    def cmd_handler(self, cmd, params):
        if cmd not in self.commands:
            raise CommandError(cmd)
        parsed_argument = self.commands[cmd]["parser"](params)
        self.commands[cmd]["method"](parsed_argument)
    
    def move(self, steps):
        print(steps)
        super().move(steps)
        super().release()
        self.currentPosition+=steps
        self.state["position"] = self.currentPosition
        self.device.release()
        
    def __move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    def goto(self, position):
        print(position)
        endPoint=self.refPoints[position]   
        self.move(endPoint-self.currentPosition)

    def __goto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]
        
    def getState(self):
        return self.state
        
    def setState(self, state):
        self.state = state

    def cleanup(self):
        super().cleanup()
    
    def reset(self):
        super().reset()
    
    

class StepperI2C(MotorKit):

    def __init__(self, name, terminal, bounds, delay=0.01, refPoints={}):
        super().__init__()
        self.commands = {
            "move": {"method": self.move, 
                     "parser": self.__move_parser
                    },
            "goto": {"method": self.goto, 
                     "parser": self.__goto_parser
                    }
                        }
        self.terminal_options = {1: super().stepper1, 2: super().stepper2}
        self.name = name
        self.device_type = "controller"
        self.refPoints = refPoints
        self.currentPosition = 0
        self.device = self.terminal_options[terminal]
        self.delay = delay
        self.style = stepper.DOUBLE
        self.lowerBound = bounds[0]
        self.upperBound = bounds[1]
        self.experiment = None
        self.state = {"position": self.currentPosition}

           
    def cmd_handler(self, cmd, params):
        if cmd not in self.commands:
            raise CommandError(cmd)
        parsed_argument = self.commands[cmd]["parser"](params)
        self.commands[cmd]["method"](parsed_argument)


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
        
    def __move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    def goto(self, position):
        print(position)
        endPoint=self.refPoints[position]   
        self.move(endPoint-self.currentPosition)

    def __goto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]
         
    def getState(self):
        return self.state
        
    def setState(self, state):
        self.state = state
          
    def cleanup(self):
        # super().cleanup(
        pass
    
    def reset(self):
        self.move(-self.currentPosition)
        # pass
  

class Keithley6514Electrometer:

    def __init__(self, name, visa_resource):
        self.name = name
        self.device_type = "measurement"
        self.commands = {
            "press": {"method": self.press_key, 
                      "parser": self.__press_key_parser
                    }
        }
        self.inst = visa_resource
        self.experiment = None
        self.state = {"setting": ""}
        # self.inst.write("SYST:INIT")
        # self.inst.write("DISP:ENAB 1")
    
    def cleanup(self):
        pass
    
    def reset(self):
        pass
        
    def cmd_handler(self, cmd, params):
        if cmd not in self.commands:
            raise CommandError(cmd)
        parsed_argument = self.commands[cmd]["parser"](params)
        self.commands[cmd]["method"](parsed_argument)

    
    def press_key(self, params):
        self.inst.write("SYST:REM")
        self.inst.write(params)
        # self.inst.write("SYST:LOC")

    def __press_key_parser(self, params):
        print(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", params)
        return params[0]
        
    def getState(self):
        return self.state
        
    def setState(self, state):
        self.state = state
        
    
class Keithley2000Multimeter: #copied unaltered from Electrometer on 200423

    def __init__(self, name, visa_resource):
        self.name = name
        self.device_type = "measurement"
        self.commands = {
            "press": {"method": self.press_key, 
                      "parser": self.__press_key_parser
                    }
        }
        self.inst = visa_resource
        self.experiment = None
        self.state = {"setting": ""}
        # self.inst.write("SYST:INIT")
    
    def cleanup(self):
        pass
    
    def reset(self):
        pass
        
    def cmd_handler(self, cmd, params):
        if cmd not in self.commands:
            raise CommandError(cmd)
        parsed_argument = self.commands[cmd]["parser"](params)
        self.commands[cmd]["method"](parsed_argument)
    
    def press_key(self, params):
        self.inst.write("SYST:REM")
        self.inst.write(params)
    
    def __press_key_parser(self, params):
        print(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", params)
        return params[0]
        
    def getState(self):
        return self.state
        
    def setState(self, state):
        self.state = state
        
    
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