#! /usr/bin/env python3

# This is an advanced version of the controller.
# most of the content is the same but it provides
# you some more flexibility. For instance it uses
# settings files to get all the constants. This 
# means that you can use the same controller on
# multiple instances of an experiment.

# In addition to settings files it gives you the
# option of running your experiment in some 
# different modes. In this advanced tutorial
# we will show you how to include the options
# of reseting your apparatus or running in
# admin mode.
# 
# RESETING:
# Reseting will delete the contents of state 
# json file. For the TemplateLab this is called
# TemplateLab.json. You would want to do this
# when everything is properly in its zero
# position. If it is not a device is not in 
# its zero position, then you may overrotate
# an object and crash the equipment.
#
# ADMIN MODE:
# Admin mode is a special mode that allows you
# to move things without updating the state of
# experiment. It might not be obvious why this
# useful so I'll explain it. We found that our
# motors would slip and lose their position
# over time. If you run in admin mode you can
# move the motor back to correct position
# remotely. Then you stop the experiment and
# start it normally and you'll be back in 
# business. 

from labcontrol import Experiment, StepperI2C, ArduCamMultiCamera

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~ ADDITIONAL MODES  ~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# This is how you set up additional modes and settings. 
# You use the argparse library. I won't explain how
# the library works but if you want to use settings
# then you will need to copy and paste up to line
# 54 and if you want to use the different modes 
# copy and paste all of this.

import argparse

parser = argparse.ArgumentParser(description="Used to select which mode to run in", prog="LabController")

parser.add_argument("-s", "--settings", required=True)
group = parser.add_mutually_exclusive_group()
group.add_argument("-r", "--reset", action="store_true")
group.add_argument("-a", "--admin", action="store_true")

args = parser.parse_args()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~ SETTINGS FILES  ~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# This is how you set up the settings files. First
# start by importing the os and json libraries. os
# helps us with paths and json allows use to read
# the settings files.

import os, json

labSettingsPath = os.path.join("home","pi", "remoteLabs", "TemplateLab", args.settings)

with open(labSettingsPath, "r") as f:
    labSettings = json.load(f)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~ CONSTANTS ~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# This is how we will setup constants using a settings
# file. Instead of defining the constants here we
# will define them in the settings json file and then
# we will read the values from that file.
cameraName = "Camera"
# If you were to go into the templateSettings.json
# file you would find a key "videoNumber" with a 
# value of 1. This is how we will set the 
# UV4LVideoNumber instead of saying the normal
# UV4LVideoNumber=1 
UV4LVideoNumber     = labSettings['videoNumber']

motor1Name = "Motor1"
motor1Terminal      = labSettings['motor1Terminal']
motor1Bounds        = labSettings['motor1Bounds']
motor1StepStyle     = labSettings['motor1StepStyle']
motor1Delay         = labSettings['motor1Delay']
motor1RefPoints     = labSettings['motor1RefPoints']
motor1Microsteps    = labSettings['motor1Microsteps']

motor2Name = "Motor2"
motor2StepStyle     = labSettings['motor2StepStyle']
motor2Bounds        = labSettings['motor2Bounds']
motor2Terminal      = labSettings['motor2Terminal']

socket_path = "/tmp/uv4l.socket"
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~ INSTANTIATING CONTROLLERS ~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#
# One of the options of the admin mode is to eliminate
# all of the bounds. This is done in the lines below.
# It doesn't actually eliminate the bounds but makes
# them incredibly large.

if args.admin:
    bounds = (-1e6, 1e6)
    motor1Bounds = bounds
    motor2Bounds = bounds
    

camera = ArduCamMultiCamera(cameraName, UV4LVideoNumber)
motor1 = StepperI2C(motor1Name, terminal=motor1Terminal, bounds=motor1Bounds, delay=motor1Delay,
                    style=motor1StepStyle, microsteps=motor1Microsteps)
motor2 = StepperI2C(motor2Name, motor2Terminal, bounds=motor2Bounds, style=motor2StepStyle)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~ ANY INITIAL SETUP CHANGES ~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
motor1.device.release()
motor2.device.release()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~ SETTING UP EXPERIMENT ~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# Ine order to allow admin mode copy and paste the
# code below from lines 152 to 155.
if args.admin:
    exp = Experiment("TemplateLab", admin=True)
else:
    exp=Experiment("TemplateLab")
exp.add_device(camera)
exp.add_device(motor1)
exp.add_device(motor2)
exp.set_socket_path(socket_path)

# The next 2 lines of code recall the experiments
# previous saved state unless you are running
# reset or in admin mode.
if not args.reset and not args.admin:
    exp.recallState()
exp.setup()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
#~~~~~~~~~~~~ RUNNING THE CONTROLLER FILE ~~~~~~~~~#
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#
# You can use the same commands to run the experiment
# as before but this time you will have two extra
# flag options. You can use -r for reset and -a for
# admin mode. The two options are mutually exclusive
# so you must choose one.
        
    
