#! /usr/bin/env python3
# Start by import Experiment from labcontrol and then any other controllers that you would like to use.
# for the template we will just add 2 stepper motors and an ArduCamMultiCamera adapter.
from labcontrol import Experiment, StepperI2C, ArduCamMultiCamera

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~ CONSTANTS ~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
## Below is list of all the constants that will be used when defining each controller

####### Camera Constants #######
# For the camera we really just need the name of the device and the videonumber.
# NAME:
# The name of the device I just typically go with Camera.
# All devices need a unique name!
#
# VIDEONUMBER:
# We don't choose this it comes from UV4l telling us what number device
# it is using. Typically it will say something like:
# "Registering Device Node node /dev/video#" where # is replaced with a 
# number. Typically 1 or 2. When you use the "remla run" cmd you should
# see this output in the console.
cameraName = "Camera"
UV4LVideoNumber = 1
################################

###### Motor 1 Constants #######
# Note that the StepperI2C is designed for the Adafruit MotorHat for the raspberry Pi.
# All of the possible constants for the StepperI2C are as follows:
#     1*: name: described above. Try to make it useful
#     2*: terminal: which terminal is the motor connected to
#     3*:bounds: How far is the motor allowed to turn. Should be list [Lower_Limit, Upper_Limit]
#     4: delay: Time between steps. Defaults to 0.02s
#     5: refPoints: A list of named points for the goto command. Default is empty {}
#     6: style: What step style you want. Options are "DOUBLE", "SINGLE", "INTERLEAVE", "MICROSTEP". Defaults to "SINGLE"
#     7: microstep: Only used if style is "MICROSTEP". Determines number of microsteps in a step. Can be 2,4,8,16,32. Defaults to 8.
#     8: limitSwitches: A list of LimitSwitch objects. Defaults to empty list[]
#     9: homeSwitch: A HomeSwitch object. Defaults to None.
#     10: degPerStep: number of degrees in a single step. This is just used for the degMove command. Defaults to nema 17 1.8 deg/step.
#     11: gearRatio: This is used when you have your motor connected to a gear or pulley with a different radius from a drive motor. Used for degMove. Defaults to 1.
#     *Required variable.
#
# For this motor we won't include any fancy switches. 
# We will set the main points and add some named reference points for fun.
motor1Name = "Motor1"
motor1Terminal = 1
motor1Bounds = [-1000, 1000]
motor1StepStyle = "MICROSTEP"
motor1Delay = 0.002
motor1RefPoints = {
    "Home": 0,
    "Location1": -999,
    "Location2": 999
}
motor1Microsteps = 16
################################

###### Motor 2 Constants #######
motor2Name = "Motor2"
motor2StepStyle = "INTERLEAVE"
motor2Bounds = [-4500, 0]
motor2Terminal = 2
################################
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#



#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~ COMMUNICATION SOCKET ~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

# This is the socket path we communicate over. 
# The default used by UV4L is /tmp/uv4l.socket
# You shouldn't need to change it unless you change
# the setting in UV4L yourself.
socket_path = "/tmp/uv4l.socket"
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~ INSTANTIATING CONTROLLERS ~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#
# Below we want to create all the controller objects
camera = ArduCamMultiCamera(cameraName, UV4LVideoNumber)
motor1 = StepperI2C(motor1Name, terminal=motor1Terminal, bounds=motor1Bounds, delay=motor1Delay,
                    style=motor1StepStyle, microsteps=motor1Microsteps)
motor2 = StepperI2C(motor2Name, motor2Terminal, bounds=motor2Bounds, style=motor2StepStyle)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~ ANY INITIAL SETUP CHANGES ~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# This is where you would want to do any intial changes
# that would be run only once at the start of the experiment.
# i.e. -Putting a particular camera on screen
#      -An initial movement of a motor
#      -Releasing the motors so the coils arent intially energized.
# This code is to release the motors at the start. 
# I don't know why the labcontroller version doesn't work.
motor1.device.release()
motor2.device.release()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~ SETTING UP EXPERIMENT ~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

exp = Experiment("TemplateLab")
exp.add_device(camera)
exp.add_device(motor1)
exp.add_device(motor2)
exp.set_socket_path(socket_path)
exp.setup()
        
        
    
