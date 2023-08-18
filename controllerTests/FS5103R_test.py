import sys
from TestModule import TestModule

sys.path.insert(0, "/home/pi/remoteLabs")
from labcontrol.Controllers import FS5103RContinuousMotor

PWM     = int(input("PWM pin \n> "))
LMTSW   = int(input("Limit switch pin \n> "))
motor   = FS5103RContinuousMotor("testMotor", PWM, LMTSW)

test = TestModule(motor, "disable")
test.run()