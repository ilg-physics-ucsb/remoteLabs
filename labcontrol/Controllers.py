import RPistepper as stp

class BaseController(object):
    
    def __init__(self, commands=[]):
        self.commands = commands
    
    def cmd_handler(self, cmd, *params):
        pass

# class Relay:
#     def __init__(self, name, pins):
#         self.commands={}
#         self.name = name
#         self.device_type = "controller"
#         self.pins=pins

class Stepper(stp.Motor):

    def __init__(self, name, pins, delay=0.01):
        super().__init__(pins, delay)
        self.commands = {
            "move": {"method": self.move, 
                     "parser": self.__move_parser
                    }
            # "jiggle": {"method": self.jiggle,
            #             "parser": self.__jiggle_parser
            # }
        }
        self.name = name
        self.device_type = "controller"
        
    
    def cmd_handler(self, cmd, params):
        if cmd not in self.commands:
            raise CommandError(cmd)
        parsed_argument = self.commands[cmd]["parser"](params)
        self.commands[cmd]["method"](parsed_argument)
    
    def move(self, steps):
        super().move(steps)
        super().release()
    
    def cleanup(self):
        super().cleanup()
    
    def reset(self):
        super().reset()
    
    def __move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    # def jiggle(self):
    #     Do jiggle stuff
    
    # def __jiggle_parser(self, params)
    #     parameters = params.split(",")
    #     l = []
    #     for p in parameters:
    #         l.append(int(p))

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
        self.inst.write("SYST:INIT")
    
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
        self.inst.write(params)
    
    def __press_key_parser(self, params):
        print(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", params)
        return params[0]

    
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
        self.inst.write("SYST:INIT")
    
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
        self.inst.write(params)
    
    def __press_key_parser(self, params):
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