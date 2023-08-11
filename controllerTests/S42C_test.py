import sys
from TestModule import TestModule

sys.path.insert(0, "/home/pi/remoteLabs")
from labcontrol.Controllers import S42CStepperMotor

motor = S42CStepperMotor("TestMotor", 26, 20, 21, (None, None), refPoints={'p1': 2000})

test = TestModule(motor, "reset")
test.run()