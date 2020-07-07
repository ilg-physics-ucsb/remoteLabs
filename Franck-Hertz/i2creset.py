import time


###############################
###      For RPi.GPIO       ###
###############################
# import RPi.GPIO as gpio
# gpio.setmode(gpio.BCM)

# freqeuncy = 50000
# clock_cycles = 16
# delay = 1/(2*frequency)

# gpio.setup(3, gpio.OUTPUT)
# gpio.output(3, True)

# for i in range(clock_cycles):
#     gpio.output(3, False)
#     time.sleep(delay)
#     gpio.output(3, True)
#     time.sleep(delay)

# gpio.setup(5, gpio.ALT2)

###############################
###      For pigpio         ###
###############################


import pigpio

freqeuncy = 50000
clock_cycles = 16
delay = 1/(2*frequency)

# pigpio uses BCM by default
pigpio.start()
pigpio.set_mode(3, pigpio.OUTPUT)
pigpio.write(3, 1)

for i in range(clock_cycles):
    pigpio.write(3, 0)
    time.sleep(delay)
    pigpio.write(3, 1)
    time.sleep(delay)

# Modes can include: INPUT, OUTPUT, ALT0, ALT1, ALT2, ALT3, ALT4, ALT5
pigpio.set_mode(3, pigpio.ALT0)
pigpio.stop()