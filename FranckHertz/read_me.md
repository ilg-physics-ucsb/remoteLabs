# Multithreading Documentation
in order to allow multithreading, we essentially need to create locks that prevent certain devices from running at the same time and queues up commands for devices that are locked.
## Add_lock Function

The add_lock function is defined in line 60 of experiment.py

This function must take in an iterable and allows multiprocessing by placing a lock on a single or multiple devices. Locking devices disables devices that share that lock from being ran at the same time. When a command is sent to a device, the device acquires the lock, disabling all other devices (including itself) executing any commands. Instead these commands are put into a queue and executed in first in first out order as soon as the original device finishes executing and releases the lock.

If two devices should not be ran at the same time, put both devices into an iterable (i.e. [device1, device2]) to create a lock that both devices share. If a device can be ran at the same time as every other device, you must still give it its own lock by placing it in an iterable (i.e. ([device1])) to enable multiprocessing and to allow multiple commands to be queued for that device.

## Changes to the codebase
### Command Thread
This thread allows us to input multiple commands to be ran in parallel. The thread is created and executed in command_handler in experiment.py. For each new command, we create a new instance, or thread, of cmd_handler in controller.py, which executes the command. This thread takes in the data decoded from data_connection (command, params, device_name) in addition to a response queue, which handles the response between the command thread and the response thread. 
### Cmd_handler
In controllers.py, cmd_handler returns a response into the queue, which is an iterable of [response, device_name].This function also handles the multithreading locking between devices. When a new instance of cmd_handler is created through the command handler, the function first acquires the lock the device is assigned to. If this lock is not available, the thread waits until the lock becomes available. In the case of multiple commands, the commands are queued up and executed in first in first out order. After the lock has been acquired, the function then executes the command. It then release the lock and inputs the response and the device_name into the queue.

### Response Thread

This function was the latter half of the command_handler function in experiment.py. This function takes in a queue as a parameter that contains the response of the Command thread. This function threaded to run on its own single thread separate from the program. The thread is ran when data_connection is called before looping to receive any data connections. 

This function logs data and updates the states of  the devices. These are race conditions, so this thread can only be ran once at a time. This function waits for a response from cmd_handler in controllers.py.  The function grabs the response and the device_name from the queue. It then logs data and updates the states of the device and then waits for the next item in the queue. 

- created by Marlon Munoz