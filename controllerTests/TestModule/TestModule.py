from time import sleep
import curses

class TestModule:
    def __init__(self, device, exit_cmd = None):
        """
        This is a test module controller object wrapper.
        Use TestModule.run() to start testing.
        Input format is [cmd]/[attr1]/[attr2]/...
        e.g. goto/100

        args:
            device -- any: the device object you would like to test
        kwargs:
            exit_cmd -- str/(None): the command (function) to execute before exiting.
                Default None will just exit without a safe shutdown.
        """
        self.device = device
        self.exit_cmd = exit_cmd
        print("Test module initialized. Input \"quit\" to quit or < ctrl/cmd + c > to force quit.\n")

    def simple_cmd_handler(self, device, cmd, params, silence = False):
        parser = getattr(device, cmd + "_parser", None)

        # If parser exists, use it to parse the params.
        if parser is not None and params is not None:
            params = parser(params)
        # If there is no parser print this statement for user.
        else:
            if not silence:
                print("No parser found.")
        # Now get the command method. If there isn't a method, it should through an AttributeError.

        try:    
            method = getattr(device, cmd)
        except:
            print("Invalid command.")
            return
        
        if method != None:
            if params == None:
                response = method()
            else:
                response = method(params)

        if not silence:
            print("Response:", response)
        
        return response

    def sweep(self, stdscr, cmd, argStart, argEnd, argStep, duration):
        if argEnd < argStart:
            if argStep > 0:
                argStep = -argStep
        
        steps = int((argEnd - argStart) / argStep) + 1

        curses.curs_set(0)
        usrInput = ord('r')
        while usrInput == ord('r'):
            for i in range(steps):
                response = self.simple_cmd_handler(self.device, cmd, [str(argStart + argStep * i)], silence = True)
                stdscr.erase()
                stdscr.addstr(0, 0, "Arg         = " + str(argStart + argStep * i))
                stdscr.addstr(1, 0, "Response    = " + str(response))
                stdscr.addstr(2, 0, "Progress: |" + "=" * int((25 * i/(steps - 1))))
                stdscr.addch(2, len("Progress: |") + 25, '|')
                stdscr.refresh()
                sleep(duration)
            stdscr.addstr(3, 0, "Sweep complete, press \"r\" to retry or any other key to return.")
            stdscr.refresh()
            curPos = stdscr.getyx()
            usrInput = stdscr.getch(curPos[0], curPos[1])

    def run(self):
        usrInput = input("> ")
        while usrInput != "quit":
            if usrInput == '':
                continue
            elif usrInput == "sweep":
                cmd         = input("Command:\n> ")
                if getattr(self.device, cmd) == None:
                    print("Invalid command.")
                argStart    = float(input("Start:\n> "))
                argEnd      = float(input("End:\n> "))
                argStep     = float(input("Step:\n> "))
                duration    = float(input("Delay (ms):\n> ")) * 1e-3
                try:
                    ret = curses.wrapper(self.sweep, cmd, argStart, argEnd, argStep, duration)
                except Exception as inst:
                    print("An error has occured during the sweep:")
                    print(inst)
                    ret = "ERR"
                print("sweep exited with", ret)
            elif usrInput == "status":
                print("Device Status: ", self.device.getState())
            else:
                cmdSeq = usrInput.split('/')
                print("Command:", cmdSeq[0])
                print("Params:\t", *cmdSeq[1:])
                if len(cmdSeq) == 1:
                    self.simple_cmd_handler(self.device, cmdSeq[0], None)
                else:
                    self.simple_cmd_handler(self.device, cmdSeq[0], cmdSeq[1:])
            print()
            usrInput = input("> ")
        print("Exiting with command:", self.exit_cmd)
        self.simple_cmd_handler(self.device, self.exit_cmd, None)