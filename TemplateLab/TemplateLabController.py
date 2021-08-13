#! /usr/bin/env python3
# This is a basic example of a controller script.
# It must have the same name as the folder it is in + Controller.py
# 
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
# You first need to instantiate the experiment.
# You do this calling the Experiment class and
# providing a name for the experiment. I don't think
# it needs to match the name of the folder it sits in
# but I do this by convention.
exp = Experiment("TemplateLab")
# Then you need to add each device to the lab using
# the add_device method. Just feed it one of the
# controllers you setup early.
exp.add_device(camera)
exp.add_device(motor1)
exp.add_device(motor2)
# Now setup the socket path. This will likely be copied
# and pasted into all of your controller files.
exp.set_socket_path(socket_path)

# In order to start the lab in the last state it
# was left in use the following method. You can 
# comment it out if you want it to start at zero
# instead.
exp.recallState()
# Finally call the setup method which will run the 
# experiment.
exp.setup()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~ RUNNING THE CONTROLLER FILE ~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# To run the controller script you first need to
# setup the lab. To do this you need to run the 
# command:
# sudo remla setup TemplateLab -s templateSettings.json
#
# The "-s settingsFile.json" must always be included
# and it should be the name of a json file in the 
# the same folder as the controller.py file. It 
# needs to be included even if there you aren't 
# utilizing the settings file.
# 
# Once setup you then can run the experiment with
# the following command:
# remla run
#
# This will run the experiment you currently have 
# setup. To stop the experiment you can use the
# command:
# remla stop
# 
# If you would like you can run the experiment in
# the foreground so you can see all of the output
# of the controller devices. To do that you use 
# the command:
# remla run -f
# 
# Now to stop the program from running you need to
# use the key binding:
# Ctrl+C    
        
    
