import RPi.GPIO as gpio
import os

gpio.setmode(gpio.BCM)
gpio.setup(4, gpio.IN)
gpio.setup(4, gpio.OUT)
gpio.output(4, gpio.LOW)
a = input("wait")