import sys
from TestModule import TestModule

sys.path.insert(0, "/home/pi/remoteLabs")
from labcontrol.Controllers import Multiplexer

multiplexerPins     = [5, 6, 13]
inhibitorPin        = int(input("Inhibitor pin > "))
multiplexerChannels = [1,2,3,4,5,6]
multiplexerDelay    = 0.1

buttons = Multiplexer("Buttons", multiplexerPins, inhibitorPin, multiplexerChannels, delay=multiplexerDelay)

test = TestModule(buttons)
test.run()