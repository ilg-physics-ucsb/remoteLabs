import sys
from TestModule import TestModule

sys.path.insert(0, "/home/pi/remoteLabs")
from labcontrol.Controllers import GeneralPWMServo

PWM     = int(input("PWM pin > "))
servo   = GeneralPWMServo("testServo", PWM)

test = TestModule(servo, "disable")
test.run()