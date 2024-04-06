import time
import tplink_smarthome as tp
import dlipower
import RPistepper as stp
from adafruit_motorkit import MotorKit
from adafruit_motor import stepper
import RPi.GPIO as gpio
import os
import subprocess
import busio
import board
import signal
from adafruit_bus_device.i2c_device import I2CDevice
import pigpio
import sys
from warnings import warn


pi = pigpio.pi()
gpio.setmode(gpio.BCM)

class BaseController(object):

    def cmd_handler(self, cmd, params, queue, device_name): # this should recieve a command, and a queue where it sends its response
        
        # Aquires lock
        self.experiment.locks[self.name].acquire()

        # Make the parser name, it should follow the naming convention <cmd>_parser. If there is no parser return None.
        parser = getattr(self, cmd+"_parser", None)

        # If parser exists, use it to parse the params.
        if parser is not None:
            params = parser(params)
        # If there is no parser print this statement for user.
        else:
            print("No Parser Found. Will just pass params to command.")

        # Now get the command method. If there isn't a method, it should throw an AttributeError.
        try:
            method = getattr(self, cmd)
        except:
            print(f"{self.__class__.__name__} does not have <{cmd}> cmd")

        if callable(method):
            response = method(params)

            # returns response
            queue.put([response, device_name])

        # Releases lock
        self.experiment.locks[self.name].release()

    def cleanup(self):
        pass

    def reset(self):
        pass

    def getState(self):
        return self.state

    def setState(self, state):
        self.state = state



class PDUOutlet(dlipower.PowerSwitch, BaseController):
    def __init__(self, name, hostname, userid, password, timeout=None, outlets=[1,2,3,4,5,6,7,8], outletMap={}):
        # self, userid=None, password=None, hostname=None, timeout=None, cycletime=None, retries=None, use_https=False
        super().__init__(hostname=hostname, userid=userid, password=password, timeout=timeout)
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.state = {1:"Off", 2:"Off", 3:"Off", 4:"Off", 5:"Off", 6:"Off", 7:"Off", 8:"Off" }
        self.outlets = outlets
        self.outletMap = outletMap

    def on(self, outletNumber):
        super().on(outletNumber)
        self.state[outletNumber] = "On"

    def off(self, outletNumber):
        super().off(outletNumber)
        self.state[outletNumber] = "Off"

    def on_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "on")
        try:
            outlet = int(params[0])
        except ValueError:
            outlet_name = params[0]
            if outlet_name not in self.outletMap:
                raise ArgumentError(outlet_name, self.outletMap, self.name, "On")
            outlet = self.outletMap[outlet_name]

        if outlet not in self.outlets:
            raise ArgumentError(self.name, "On", "Outlet "+ params[0], allowed="Outlets " + str(self.outlets))
        return outlet

    def off_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "off")
        try:
            outlet = int(params[0])
        except ValueError:
            outlet_name = params[0]
            if outlet_name not in self.outletMap:
                raise ArgumentError(outlet_name, self.outletMap, self.name, "Off")
            outlet = self.outletMap[outlet_name]

        if outlet not in self.outlets:
            raise ArgumentError(self.name, "Off", "Outlet "+ params[0], allowed="Outlets " + str(self.outlets))
        return outlet

    def reset(self):
        for outlet in self.outlets:
            self.off(outlet)


class Plug(tp.TPLinkSmartDevice, BaseController):
    def __init__(self, name, host, port=9999, timeout=10, connect=True):
        print(host, port, timeout, connect)
        super().__init__(host=host, port=port, connect=connect)
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.state = {"relayState": "OFF"}

    def setRelay(self,newRelay):
        print(newRelay)
        if newRelay=="OFF":
            super().send({'system': {'set_relay_state': {'state': 0}}})
        elif newRelay=="ON":
            super().send({'system': {'set_relay_state': {'state': 1}}})
        self.state["relayState"] = newRelay

    def setRelay_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "setRelay")
        return params[0]

    def cleanup(self):
        super().close()

    def reset(self):
        super().send({'system': {'set_relay_state': {'state': 0}}})
        super().close()


class StepperSimple(stp.Motor, BaseController):

    def __init__(self, name, pins, delay=0.02, refPoints={}):
        super().__init__(pins, delay)
        self.name = name
        self.device_type = "controller"
        self.refPoints = refPoints
        self.currentPosition = 0
        self.experiment = None
        self.state = {"position": self.currentPosition}

    def move(self, steps):
        print(steps)
        super().move(steps)
        super().release()
        self.currentPosition+=steps
        self.state["position"] = self.currentPosition
        self.device.release()

    def move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    def goto(self, position):
        print(position)
        endPoint=self.refPoints[position]
        self.move(endPoint-self.currentPosition)

    def goto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]

    def cleanup(self):
        super().cleanup()

    def reset(self):
        super().reset()


class DCMotorI2C(MotorKit, BaseController):

    def __init__(self, name, terminal):
        if terminal > 4:
            self.address=0x61
        else:
            self.address=0x60
        super().__init__(address=self.address)
        self.name = name
        self.device_type = "controller"
        self.experiment = None

        self.terminal_options = {1: super().motor1, 2: super().motor2, 3:super().motor3, 4:super().motor4,
            5: super().motor1, 6:super().motor2, 7:super().motor3, 8:super().motor4}
        self.device = self.terminal_options[terminal]
        self.currentPosition = 0
        self.state = {"position": self.currentPosition}

    def setup(self, style):
        pass

    def reset(self):
        pass

    def throttle(self, speed):
        self.device.throttle = speed

    def throttle_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        print("Throttle is set to: {0}".format(params[0]))
        return float(params[0])

# Initialise the first hat on the default address
# lowerBoard = MotorKit()
# Initialise the second hat on a different address
# upperBoard = MotorKit(address=0x61)

class StepperI2C(MotorKit, BaseController):

    def __init__(self, name, terminal, bounds, delay=0.02, refPoints={}, style="SINGLE", microsteps=8, limitSwitches=[], homeSwitch=None, degPerStep=1.8, gearRatio=1):
        if terminal > 2:
            self.address=0x61
        else:
            self.address=0x60
        super().__init__(address=self.address, steppers_microsteps=microsteps)
        self.name = name
        self.device_type = "controller"
        self.experiment = None

        self.terminal_options = {1: super().stepper1, 2: super().stepper2, 3:super().stepper1, 4:super().stepper2}
        self.refPoints = refPoints
        self.currentPosition = 0
        self.device = self.terminal_options[terminal]
        self.delay = delay
        self.lowerBound = bounds[0]
        self.upperBound = bounds[1]
        self.styles = {
            "SINGLE": stepper.SINGLE,
            "DOUBLE": stepper.DOUBLE,
            "MICROSTEP": stepper.MICROSTEP,
            "INTERLEAVE": stepper.INTERLEAVE
        }
        self.style = self.styles[style]

        self.state = {"position": self.currentPosition}
        self.limitSwitches = limitSwitches
        self.homeSwitch = homeSwitch
        self.homing = False
        self.degPerStep = degPerStep
        self.gearRatio = gearRatio
        self.device.release()

    def setup(self, style):
        pass

    def move(self, steps):
        print(steps)
        if steps >= 0:
            direction = stepper.BACKWARD
        else:
            direction = stepper.FORWARD
        if self.currentPosition+steps <self.lowerBound and steps < 0:
            steps = self.lowerBound-self.currentPosition
        elif self.currentPosition+steps >self.upperBound and steps > 0:
            steps = self.upperBound-self.currentPosition

        for i in range(abs(steps)):

            if len(self.limitSwitches) != 0:
                for switch in self.limitSwitches:
                    status = switch.getStatus(1)
                    if status == gpio.HIGH:
                        response = switch.switchAction(self, steps-i)
                        if response is None:
                            return "{0}/{1}/{2}".format(self.name, "position", "limit")
                        else:
                            return response

            if self.homing:
                homeStatus = self.homeSwitch.getStatus(1)
                if homeStatus == gpio.HIGH:
                    return True

            self.device.onestep(style=self.style, direction=direction)
            time.sleep(self.delay)

        self.currentPosition+=steps
        self.state["position"] = self.currentPosition
        self.device.release()
        if self.currentPosition == self.upperBound or self.currentPosition == self.lowerBound:
            return "{0}/{1}/{2}".format(self.name, "position", "limit")
        else:
            return "{0}/{1}/{2}".format(self.name, "position", self.currentPosition)

    def move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    def adminMove(self, steps):
        if steps >= 0:
            direction = stepper.BACKWARD
        else:
            direction = stepper.FORWARD
        if self.currentPosition+steps <self.lowerBound and steps < 0:
            steps = self.lowerBound-self.currentPosition
        elif self.currentPosition+steps >self.upperBound and steps > 0:
            steps = self.upperBound-self.currentPosition
        for i in range(abs(steps)):
            self.device.onestep(style=self.style, direction=direction)
            time.sleep(self.delay)
        self.currentPosition+=steps
        self.state["position"] = self.currentPosition
        self.device.release()

    def goto(self, position):
        print(position)
        endPoint=self.refPoints[position]
        response = self.move(endPoint-self.currentPosition)
        return response

    def admingoto(self, position):
        print(position)
        endPoint=self.refPoints[position]
        response = self.adminMove(endPoint-self.currentPosition)
        return response

    def goto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]
    
    def admingoto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "admingoto")
        return params[0]

    def degMove_parser(self, params):
        try:
            steps = float(params[0])
        except ValueError:
            raise ArgumentError(self.name, "degMove", params)
        return steps

    def degMove(self, deg):
        print("{0} degrees".format(deg))
        step = deg / self.degPerStep
        step = int(step * self.gearRatio)
        step = round(step)
        response = self.move(step)
        return response


    def homeMove(self, stepLimit=5000, additionalSteps=10):
        if self.currentPosition > 0:
            direction = -1
        elif self.currentPosition < 0:
            direction = 1
        else:
            return

        self.move(direction*stepLimit)
        self.move(direction*additionalSteps)


    def reset(self):
        if self.homeSwitch is not None:
            self.home(1)
        else:
            self.move(-self.currentPosition)
        # pass

    def home(self, params):
        if self.homeSwitch is not None:
            self.homing = True
            self.customHome(self)
            self.homing = False
        else:
            print("No homing switch is attached to this motor")

    def customHome(self, motor):
        pass

class AbsorberController(MotorKit, BaseController):

    def __init__(self, name, stepper, actuator, magnet, initialState, holderMap, downtime=0.5, uptime=1, throttle=1.0):
        self.name = name
        self.device_type = "controller"
        self.experiment = None
        self.downtime = downtime
        self.uptime = uptime
        self.stepper = stepper
        self.actuator = actuator
        self.magnet = magnet
        self.initialState = initialState
        self.holderMap = holderMap
        self.throttle = throttle
        self.state = {
            "loaded": {
                "s0":False,
                "s1":False,
                "s2":False,
                "s3":False,
                "s4":False,
                "s5":False
            },

            "total": self.initialState
        }


    def setup(self, style):
        pass

    def reset(self):
        emptyCounter = [ ("s0", ""), ("s1", ""), ("s2", ""), ("s3", ""), ("s4", ""), ("s5", "") ]
        movesList = self.__makeMovesList(emptyCounter)
        self.place(movesList)
        self.stepper.reset()

    def __transfer(self, slot1, slot2):
        # TODO: magnet control needs to be fixed

        absorber = self.state["total"][slot1]
        # print(f"Transfer {absorber} from {slot1} --> {slot2}")
        if self.state['total'][slot2] != '':
            print(f'!!!!!!!!!!!WARNING:  Slot {slot2} already full with {self.state["total"][slot2]}')
            raise
        # global x
        # x += 1
        self.stepper.goto(slot1)
        self.actuator.throttle(self.actuator.throttle_parser([self.throttle]))
        time.sleep(self.downtime)
        self.actuator.throttle(self.actuator.throttle_parser([0]))
        # absorber gets attached to the magnet
        time.sleep(0.5)
        self.actuator.throttle(self.actuator.throttle_parser([-self.throttle]))
        time.sleep(self.uptime)
        self.actuator.throttle(self.actuator.throttle_parser([0]))

        self.stepper.goto(slot2)
        self.actuator.throttle(self.actuator.throttle_parser([self.throttle]))
        time.sleep(self.downtime)
        self.actuator.throttle(self.actuator.throttle_parser([0]))

        # push magnet and drop the absorber
        self.magnet.goto(45)

        self.actuator.throttle(self.actuator.throttle_parser([-self.throttle]))
        time.sleep(self.uptime)
        self.actuator.throttle(self.actuator.throttle_parser([0]))
        self.actuator.disable()
        self.magnet.goto(-90)
        time.sleep(1)
        self.magnet.disable()


        self.state["total"][slot1] = ''
        self.state["total"][slot2] = absorber
        if slot1 in self.state["loaded"]:
            self.state["loaded"][slot1] = False
        if slot2 in self.state["loaded"]:
            self.state["loaded"][slot2] = True

    def __getSlot(self, absorber):
        # print(f"GET SLOT: {absorber}")
        if absorber == '':
            return -1
        for holderSlot, ab in self.state["total"].items():
            if ab == absorber:
                return holderSlot

    def __getAbsorber(self, slot):
        return self.state["total"][slot]

    def __makeMovesList(self, newPositions):
        moveList = {
            "load": [],
            "unload": [],
            "internal": [],
            "chains": []
        }

        absorbers = [item[1] for item in newPositions if item[1] != '']
        for slot, ab in newPositions:
            # slot is one of the counter slots. We will loop through all slots in the coutner.
            # ab is the absorber we want to end up in slot.

            # Get the absorber that is currently in the slot
            currentAbsInSlot = self.__getAbsorber(slot)
            # Get the location of the current absorber
            currentAbsLocation = self.__getSlot(ab)
            print(f"Absorber: {ab}  Location: {currentAbsLocation}")

            # Determine if the absorber is used later down the line
            absorberUsed = currentAbsInSlot in absorbers
            if ab == currentAbsInSlot:
                ## If the absorber is already in the correct slot there is nothing todo.
                continue

            elif ab == '' and self.state["loaded"][slot]:
                # If we want the slot to be empty, it is current loaded and the
                # loaded absorber is not used later, then unload it.
                if not absorberUsed:
                    moveList["unload"].append( (slot, self.holderMap[currentAbsInSlot]) )

            elif ab != '' and self.state["loaded"][slot]:
                # If we want the slot to be full and it is already full with a
                # different absorber.
                if not absorberUsed:
                    # If the currently loaded absorber is not needed, unload it.
                    # If it is used later, we will handle that one later in the loop
                    moveList["unload"].append( (slot, self.holderMap[currentAbsInSlot]) )
                if currentAbsLocation[0] == "s":
                    # If the absorbr we want is already in the counter
                    # add it to an internal movement
                    moveList["internal"].append( (currentAbsLocation, slot) )
                else:
                    # If it isn't already in the counter it must be in the holder
                    # so add it to the load movement list.
                    moveList["load"].append( (currentAbsLocation, slot) )

            elif ab != '' and not self.state["loaded"][slot]:
                # If we want to fill the slot and nothing is there already just move
                # if following the same rules above without an unload first.
                if currentAbsLocation[0] == "s":
                    moveList["internal"].append( (currentAbsLocation, slot) )
                else:
                    moveList["load"].append( (currentAbsLocation, slot) )

        ## Now we should identify chains.
        chains = self.__chainDetect(moveList["internal"])
        internalStarts = [ item[0] for item in moveList["internal"] ]
        print("Pre-chains: {0}".format(moveList))
        for chain in chains:
            for move in chain:
                moveList["internal"].remove(move)

        moveList["chains"] = chains
        print("Post-chains: {0}".format(moveList))
        return moveList

    def __chainDetect(self, movements):
        chains = []
        checked = []
        internalStarts = [ item[0] for item in movements ]
        internalFinish = [ item[1] for item in movements ]
        intersection = [slot for slot in internalStarts if slot in internalFinish]

        for move in movements:
            temp = []
            if move[0] in checked:
                continue
            # checked.append(move[0])
            if move[0] in intersection and move[1] in intersection:
                start = move[0]
                checked.append(start)
                nextSlot = move[1]
                temp.append(move)
                while nextSlot != start:
                    i=0
                    for nextMove in movements:
                        if nextMove[0] == nextSlot:
                            checked.append(nextMove[0])
                            nextSlot = nextMove[1]
                            temp.append(nextMove)
                            i -= 1
                            break
                        # print(f"{nextMove} and {nextSlot}")
                    i += 1
                    if i > 0:
                        break
                if i <= 0:
                    chains.append(temp)
        # print(f"CHAINS: {chains}")
        return chains

    def __chaseInternal(self, internals, startingMove):
        moves = [startingMove]
        internalStarts = [item[0] for item in internals]
        # internalStartsTemp = internalStarts.copy()
        nextSlot = startingMove[1]
        while nextSlot in internalStarts:
            index = internalStarts.index(nextSlot)
            iMove = internals.pop(index)
            internalStarts.pop(index)
            moves.insert(0, iMove)
            nextSlot = iMove[1]
        return moves

    def __handleChains(self, chains, currentMoves):
        currentFinish = [item[1] for item in currentMoves]
        slots = ['s0', 's1', 's2', 's3', 's4', 's5']
        for chain in chains:
            move1 = chain.pop(0)
            ab = self.__getAbsorber(move1[0])
            home = self.holderMap[ab]
            # for slot in slots:
            #     if slot not in currentFinish:
            #         home = slot
            #         break
            # print(f"CHAIN HOME: ({move1[0]}, {home})")
            currentMoves.append( (move1[0], home) )
            chain.reverse()
            for move in chain:
                currentMoves.append(move)
                # print(f"CHAIN MOVE REVERSE: {move}")
            currentMoves.append( (home, move1[1]) )
            # print(f"CHAIN BACK: ({home}, {move1[1]})")
            currentFinish = [item[1] for item in currentMoves]
        return currentMoves

    def __handleInternal(self, internals):
        moves = []
        if len(internals) == 0:
            return moves

        internalGroups = []
        while len(internals) != 0:
            start = internals.pop(0)
            temp = self.__chaseInternal(internals, start)
            internalGroups.append(temp)

        for group in internalGroups:
            moves += group

        return moves

    def __buildGroups(self, moveList):
        unloads = moveList["unload"]
        loads = moveList["load"]
        internals = moveList["internal"]
        print("INTERNALS:{0}".format(internals))
        unloadStarts = [item[0] for item in unloads]
        UILGroups = []
        ILGroups = []
        LGroups = []
        UIGroups = []
        IGroups = []
        moves = []

        for load in loads:
            temp = self.__chaseInternal(internals, load)
            internalStarts = [item[0] for item in internals]

            if len(temp) == 1:
                LGroups.append(temp)

            else:
                nextSlot = temp[0][1]
                # print(f"Checking for conflict with unload. Slot {nextSlot}")
                if nextSlot in unloadStarts:
                    # print("Internal Movement Conflict with Following Unload")
                    index = unloadStarts.index(nextSlot)
                    uMove = unloads.pop(index)
                    unloadStarts.remove(uMove[0])
                    temp.insert(0, uMove)
                    UILGroups.append(temp)
                else:
                    ILGroups.append(temp)

        if len(internals) > 0:
            print("Starting Internals")
            internalStarts = [item[0] for item in internals]
            internalFinish = [item[1] for item in internals]
            intersection = [item for item in internalFinish if item in internalStarts]
            print("Intersections: {0}".format(intersection))
            starts = [internal for internal in internals if internal[1] in intersection]
            for start in starts:
                internals.remove(start)
            print("INTERNALS2:{0}".format(internals))
            print("STARTS:{0}".format(starts))
            for startingI in starts:
                temp = self.__chaseInternal(internals, startingI)
                print("CHASEINTERNALS:{0}".format(temp))
                internalStarts = [item[0] for item in internals]
                nextSlot = temp[0][1]
                # print(f"Checking for conflict with unload. Slot {nextSlot}")
                if nextSlot in unloadStarts:
                    # print("Internal Movement Conflict with Following Unload")
                    index = unloadStarts.index(nextSlot)
                    uMove = unloads.pop(index)
                    unloadStarts.remove(uMove[0])
                    temp.insert(0, uMove)
                    UIGroups.append(temp)
                else:
                    IGroups.append(temp)
            for internal in internals:
                IGroups.append([internal])

        for uil in UILGroups:
            uMove = [uil.pop(0)]
            lMove = [uil.pop(-1)]
            igroup = uil

            if len(unloads) > 0:
                uTemp = unloads.pop(0)
                igroup.append(uTemp)

            elif len(UIGroups) > 0:
                uiTemp = UIGroups.pop(0)
                uTempMove = uiTemp.pop(0)
                igroup.append(uTempMove)
                lMove = lMove + uiTemp

            if len(LGroups) > 0:
                lTemp = LGroups.pop(0)
                igroup.insert(0, lTemp[0])

            elif len(ILGroups) > 0:
                ilTemp = ILGroups.pop(0)
                lTempMove = ilTemp.pop(-1)
                igroup.insert(0,lTempMove)
                uMove = ilTemp + uMove

            # moves.append(uMove + igroup + lMove)
            moves += uMove + igroup + lMove

        for il in ILGroups:
            uMove = []
            lMove = [il.pop(-1)]
            igroup = il

            if len(unloads) > 0:
                uTemp = unloads.pop(0)
                igroup.append(uTemp)

            elif len(UIGroups) > 0:
                uiTemp = UIGroups.pop(0)
                uTempMove = uiTemp.pop(0)
                igroup.append(uTempMove)
                lMove = lMove + uiTemp

            # moves.append(igroup + lMove)
            moves += igroup + lMove

        for l in LGroups:
            uMove = []
            lMove = l
            igroup = []

            if len(unloads) > 0:
                uTemp = unloads.pop(0)
                igroup.append(uTemp)

            elif len(UIGroups) > 0:
                uiTemp = UIGroups.pop(0)
                uTempMove = uiTemp.pop(0)
                igroup.append(uTempMove)
                lMove = lMove + uiTemp

            # moves.append(igroup + lMove)
            moves += igroup + lMove

        while len(unloads) > 0 or len(UIGroups) > 0:

            if len(UIGroups) > 0:
                moves = UIGroups.pop(0) + moves
            elif len(unloads) > 0:
                print(unloads)
                moves.insert(0, unloads.pop(0))

        while len(IGroups) > 0:
            moves += IGroups.pop(0)

        return moves

    def place(self, moveList):

        moves = []
        internalStarts = [ item[0] for item in moveList["internal"]]
        internalFinish = [ item[1] for item in moveList["internal"]]
        unloadStarts = [ item[0] for item in moveList["unload"]]

        # print("\r\n ### Pairing Checks")
        uMovesTemp = moveList["unload"].copy()
        lMovesTemp = moveList["load"].copy()
        for uMove in moveList["unload"]:
            # print(f"PAIRING CHECK: {uMove}, {moveList['unload']}, {moveList['load']},")
            for lMove in moveList["load"]:
                # print(f"PARING CHECK2: {lMove}")
                if uMove[0] == lMove[1]:
                    moves.append(uMove)
                    moves.append(lMove)
                    uMovesTemp.remove(uMove)
                    lMovesTemp.remove(lMove)
                    # print(f"PARING: {uMove} with {lMove}")

        moveList["unload"] = uMovesTemp
        moveList["load"] = lMovesTemp
        unloadStarts = [ item[0] for item in moveList["unload"]]

        # print("## Pairings Complete")
        # pp.pprint(moveList)

        # print("## ORGANIZING EVERYTING BUT CHAINS")
        moves += self.__buildGroups(moveList)

        if len(moveList["chains"]) > 0:
            # print("## Handling Chains")
            moves = self. __handleChains(moveList["chains"], moves)

        # pp.pprint(moveList)
        print("Moves:{0}".format(moves))
        for move in moves:
            self.__transfer(move[0], move[1])

    def place_parser(self, params):
        # if len(params) != 1:
        #     raise ArgumentNumberError(len(params), 1, "place")
        # print("Throttle is set to: {0}".format(params[0]))
        print(params)
        temp = [item.replace("(","").replace(")","") for item in params]
        absorberList = []
        i = 0
        print("RAFFI LOOK AT ME: {0}".format(temp))
        while i < len(temp):
            absorberList.append((temp[i], temp[i+1]))
            i += 2

        print("NEVER THOUGHT I'D BE ON A BOAT: {0}".format(absorberList))
        moveList = self.__makeMovesList(absorberList)

        return moveList

class Multiplexer(BaseController):

    def __init__(self, name, pins, inhibitorPin, channels=[0,1,2,3,4,5,6,7], defaultChannel=None, defaultState=gpio.HIGH, delay=0.1):
        self.state = {}
        self.name = name
        self.experiment = None
        self.device_type = "controller"
        self.delay = delay
        self.pins = pins
        self.channels = channels
        self.defaultState = defaultState
        self.defaultChannel = defaultChannel
        self.inhibitorPin = inhibitorPin

        gpio.setup(self.pins, gpio.OUT)
        gpio.setup(self.inhibitorPin, gpio.OUT)

        if self.defaultChannel is not None:
            self.__setChannel(self.defaultChannel)
            gpio.output(self.inhibitorPin, self.defaultState)
        else:
            gpio.output(self.inhibitorPin, gpio.HIGH)


    def __setChannel(self, channel):
        binary = "{0:0{1}b}".format(channel, len(self.pins))
        gpio.output(self.inhibitorPin, gpio.HIGH)
        for i in range(len(self.pins)):
            pin = self.pins[i]
            state = bool(int(binary[i]))
            pinstate = gpio.LOW
            if state:
                pinstate = gpio.HIGH

            gpio.output(pin, pinstate)

    def press(self, channel):
        self.__setChannel(channel)
        gpio.output(self.inhibitorPin, gpio.LOW)
        time.sleep(self.delay)
        gpio.output(self.inhibitorPin, gpio.HIGH)

    def press_parser(self, params):
        channel = int(params[0])
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "press")
        if channel not in self.channels:
            raise ArgumentError(self.name, "press", channel, self.channels)
        return channel


    def reset(self):
        if self.defaultChannel is not None:
            self.__setChannel(self.defaultChannel)
        gpio.output(self.inhibitorPin, self.defaultState)

class Keithley6514Electrometer(BaseController):

    def __init__(self, name, visa_resource):
        self.name = name
        self.device_type = "measurement"
        self.experiment = None
        self.state = {"setting": ""}

        self.inst = visa_resource

    def press(self, params):
        self.inst.write("SYST:REM")
        self.inst.write(params)
        if params != "SYST:KEY 1":
            self.inst.write("SYST:LOC")

    def press_parser(self, params):
        print(">>", params)
        return params[0]



class Keithley2000Multimeter(BaseController): #copied unaltered from Electrometer on 200423

    def __init__(self, name, visa_resource):
        self.name = name
        self.device_type = "measurement"
        self.experiment = None
        self.state = {"setting": ""}

        self.inst = visa_resource


    def press(self, params):
        self.inst.write("SYST:REM")
        self.inst.write(params)

    def press_parser(self, params):
        print(">>", params)
        return params[0]


class PololuStepperMotor(BaseController):

    def __init__(self, name, stepPin, directionPin, enablePin, bounds, delay=5000,
                    refPoints={}, limitSwitches=[], homeSwitch=None,
                    degPerStep=1.8, gearRatio=1):
        self.name = name
        self.device_type = "controller"
        self.stepPin = stepPin
        self.directionPin = directionPin
        self.enablePin = enablePin

        pi.set_mode(self.stepPin, pigpio.OUTPUT)
        pi.set_pull_up_down(self.stepPin, pigpio.PUD_DOWN)
        pi.set_mode(self.enablePin, pigpio.OUTPUT)
        pi.set_pull_up_down(self.enablePin, pigpio.PUD_DOWN)
        pi.set_mode(self.directionPin, pigpio.OUTPUT)
        pi.set_pull_up_down(self.directionPin, pigpio.PUD_DOWN)

        pi.write(self.enablePin, 0)


        self.refPoints = refPoints
        self.currentPosition = 0
        self.state={
            'position': self.currentPosition
        }
        self.delay = delay
        self.lowerBound = bounds[0]
        self.upperBound = bounds[1]
        # self.styles = {
        #     "SINGLE": stepper.SINGLE,
        #     "DOUBLE": stepper.DOUBLE,
        #     "MICROSTEP": stepper.MICROSTEP,
        #     "INTERLEAVE": stepper.INTERLEAVE
        # }
        # self.style = self.styles[style]

        self.state = {"position": self.currentPosition}
        self.limitSwitches = limitSwitches
        self.homeSwitch = homeSwitch
        self.homing = False
        self.degPerStep = degPerStep
        self.gearRatio = gearRatio


    def move(self, steps):

        # Choose direction
        if steps > 0:
            pi.write(self.directionPin, 1)
        else:
            pi.write(self.directionPin, 0)

        if self.currentPosition+steps <self.lowerBound and steps < 0:
            steps = self.lowerBound-self.currentPosition
        elif self.currentPosition+steps >self.upperBound and steps > 0:
            steps = self.upperBound-self.currentPosition

        #Create a train of pulses separated by delay
        pOn = pigpio.pulse(1<<self.stepPin, 0, self.delay//2)
        pOff = pigpio.pulse(0, 1<<self.stepPin, self.delay//2)
        pulse = [pOn, pOff]
        pi.wave_clear()
        pi.wave_add_generic(pulse)
        stepWave = pi.wave_create()

        absteps = abs(steps)
        step_y = absteps//256
        step_x = absteps%256

        pi.write(self.enablePin, 1)
        ## Wave Chains seems incredibly stupid.
        ## To see how to do it check out http://abyz.me.uk/rpi/pigpio/python.html#wave_chain
        pi.wave_chain([
            255, 0,                     # Starts a loop
                stepWave,               # What wave to send
            255, 1, step_x, step_y      # Repeat loop x + 256*y times.
        ])

        while pi.wave_tx_busy():
            time.sleep(0.1)

        pi.write(self.enablePin, 0)

        self.currentPosition += steps
        self.state['position'] = self.currentPosition


        if self.currentPosition == self.upperBound or self.currentPosition == self.lowerBound:
            return "{0}/{1}/{2}".format(self.name, "position", "limit")
        else:
            return "{0}/{1}/{2}".format(self.name, "position", self.currentPosition)


    def move_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    # def adminMove(self, steps):
    #     if steps >= 0:
    #         direction = stepper.BACKWARD
    #     else:
    #         direction = stepper.FORWARD
    #     if self.currentPosition+steps <self.lowerBound and steps < 0:
    #         steps = self.lowerBound-self.currentPosition
    #     elif self.currentPosition+steps >self.upperBound and steps > 0:
    #         steps = self.upperBound-self.currentPosition
    #     for i in range(abs(steps)):
    #         self.device.onestep(style=self.style, direction=direction)
    #         time.sleep(self.delay)
    #     self.currentPosition+=steps
    #     self.state["position"] = self.currentPosition
    #     self.device.release()

    def goto(self, position):
        print(position)
        endPoint=self.refPoints[position]
        self.move(endPoint-self.currentPosition)

    def goto_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]

    def degMove_parser(self, params):
        try:
            steps = float(params[0])
        except ValueError:
            raise ArgumentError(self.name, "degMove", params)
        return steps


    def degMove(self, deg):
        print("{0} degrees".format(deg))
        step = deg / self.degPerStep
        step = int(step * self.gearRatio)
        step = round(step)
        response = self.move(step)
        return response


    def homeMove(self, stepLimit=5000, additionalSteps=10):
        if self.currentPosition > 0:
            direction = -1
        elif self.currentPosition < 0:
            direction = 1
        else:
            return

        self.move(direction*stepLimit)
        self.move(direction*additionalSteps)


    def reset(self):
        if self.homeSwitch is not None:
            self.home(1)
        else:
            self.move(-self.currentPosition)
        # pass

    def home(self, params):
        if self.homeSwitch is not None:
            self.homing = True
            self.customHome(self)
            self.homing = False
        else:
            print("No homing switch is attached to this motor")

    def customHome(self, motor):
        pass


class PololuDCMotor(BaseController):

    def __init__(self, name, pwmPin, directionPin, notEnablePin, stopPin=None, rising=True, steadyState=20000, frequency=100, dutyCycle=0, pwmScaler=255):
        self.name = name
        self.device_type = "controller"
        self.pwmPin = pwmPin
        self.directionPin = directionPin
        self.notEnablePin = notEnablePin
        self.frequency = frequency
        self.dutyCycle = dutyCycle
        self.stopPin = stopPin
        self.steadyState = steadyState
        self.pulseCount = 0
        self.pwmScaler = pwmScaler


        if  self.stopPin is not None:
            if rising:
                pi.set_mode(stopPin, pigpio.INPUT)
                pi.set_pull_up_down(stopPin, pigpio.PUD_DOWN)
                pi.set_glitch_filter(stopPin, self.steadyState)
                pi.callback(stopPin, pigpio.RISING_EDGE, self.__stop)
                # gpio.setup(self.stopPin, gpio.IN, pull_up_down=gpio.PUD_DOWN)
                # gpio.add_event_detect(self.stopPin, gpio.RISING, callback=self.__stop, bouncetime=100)
            else:
                pi.set_mode(stopPin, pigpio.INPUT)
                pi.set_pull_up_down(stopPin, pigpio.PUD_UP)
                pi.set_glitch_filter(stopPin, self.steadyState)
                pi.callback(stopPin, pigpio.FALLING_EDGE, self.__stop)
                # gpio.setup(self.stopPin, gpio.IN, pull_up_down=gpio.PUD_UP)
                # gpio.add_event_detect(self.stopPin, gpio.FALLING, callback=self.__stop, bouncetime=100)

            
            
            



        # gpio.setup([self.pwmPin, self.directionPin, self.notEnablePin], gpio.OUT)
        for pin in [self.pwmPin, self.directionPin, self.notEnablePin]:
            pi.set_mode(pin, pigpio.OUTPUT) 
        # gpio.output(self.notEnablePin, gpio.LOW)
        pi.write(self.notEnablePin, 0)
        pi.set_PWM_frequency(self.pwmPin, self.frequency)
        pi.set_PWM_dutycycle(self.pwmPin, dutyCycle)
        # self.pwm = gpio.PWM(self.pwmPin, self.frequency)
        # self.pwm.start(dutyCycle)

        self.state={}
    
    def __stop(self, gpio, level, tick):
        print("MOTOR IS CRASHING! HALTING!")
        self.throttle(self.throttle_parser([1]))
        time.sleep(2)
        self.throttle(self.throttle_parser([0]))
        pi.stop()
        sys.exit(0)
        # self.pulseCount += 1
        # print("PULSED {0}".format(self.pulseCount))
        # gpio.cleanup()
        # sys.exit(0)

    def throttle(self, speed):
        # if speed >= 0:
        #     # gpio.output(self.directionPin, gpio.LOW)
        # else:
        #     # gpio.output(self.directionPin, gpio.HIGH)
        pi.write(self.directionPin, speed<=0)

        self.dutyCycle = abs(speed)
        # self.pwm.ChangeDutyCycle(self.dutyCycle)
        pi.set_PWM_dutycycle(self.pwmPin, self.dutyCycle)

    def throttle_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "throttle")

        speed = float(params[0])*self.pwmScaler

        if speed < -self.pwmScaler or speed > self.pwmScaler:
            raise ArgumentError(self.name, "throttle", speed/self.pwmScaler, "-1 <= speed <= 1")

        return speed



class ArduCamMultiCamera(BaseController):

    def __init__(self, name, videoNumber=0, defaultSettings=None, i2cbus=11, initialCamera="a", controlPins=[4,17,18], cameraNamesDict=None):
        self.name = name
        self.videoNumber = videoNumber
        self.device_type = "measurement"
        self.experiment = None
        self.state = {}
        self.defaultSettings = defaultSettings
        self.i2cbus = i2cbus
        self.cameraNames = cameraNamesDict

        # Define Pins
        # Board Pin 7 = BCM Pin 4 = Selection
        # Board Pin 11 = BCM Pin 17 = Enable 1
        # Board Pin 12 = BCM Pin 18 = Enable 2
        # See Arducam User Guide https://www.uctronics.com/download/Amazon/B0120.pdf
        self.selection, self.enable1, self.enable2 = controlPins
        self.channels = controlPins
        gpio.setup(self.channels, gpio.OUT)



        self.cameraDict = {
            "a": (gpio.LOW, gpio.LOW, gpio.HIGH),
            "b": (gpio.HIGH, gpio.LOW, gpio.HIGH),
            "c": (gpio.LOW, gpio.HIGH, gpio.LOW),
            "d": (gpio.HIGH, gpio.HIGH, gpio.LOW),
            "off":(gpio.LOW, gpio.HIGH, gpio.HIGH)
        }

        self.camerai2c = {
            'a': "i2cset -y {0} 0x70 0x00 0x04".format(self.i2cbus),
            'c': "i2cset -y {0} 0x70 0x00 0x06".format(self.i2cbus),
            'd': "i2cset -y {0} 0x70 0x00 0x07".format(self.i2cbus),
            'b': "i2cset -y {0} 0x70 0x00 0x05".format(self.i2cbus),
        }

        # Set camera for A
        self.camera(initialCamera)

    def camera(self, param):
        #Param should be a, b, c, d, or off
        print("Switching to camera "+param)
        os.system(self.camerai2c[param])
        gpio.output(self.channels, self.cameraDict[param])

    def camera_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "camera")
        param = params[0].lower()
        if param not in self.cameraDict:
            raise ArgumentError(self.name, "camera", param, ["a", 'b', 'c', 'd', 'off'])
        return params[0].lower()

    # This is a translation layer so we can switch by named camera instead of slots.
    # The name should be translated from the dictionary self.cameraNames
    def cameraName(self, param):
        cameraSlot = self.cameraNames[param]
        print("Switching to camera {0}, slot {1}".format(param, cameraSlot))
        os.system(self.camerai2c[cameraSlot])
        gpio.output(self.channels, self.cameraDict[cameraSlot])
    
    def cameraName_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "cameraName")
        param = params[0].lower()
        if param not in self.cameraNames:
            raise ArgumentError(self.name, "cameraName", param, self.cameraNames)
        return param

    def imageMod(self, params):
        imageControl = params[0]
        controlValue = params[1]
        subprocess.run('v4l2-ctl -d /dev/video{0} -c {1}={2}'.format(self.videoNumber, imageControl, controlValue),
                    shell=True)

    def imageMod_parser(self, params):
        if len(params) != 2:
            raise ArgumentNumberError(len(params), 2, "imageMod")
        return params

    def reset(self):
        if self.defaultSettings is not None:
            for setting, value in self.defaultSettings.items():
                self.imageMod([setting,value])
                time.sleep(0.1)

class ElectronicScreen(BaseController):

    def __init__(self, name, pin):
        self.pin = pin
        self.name = name
        self.state = "off"
        gpio.setup(self.pin, gpio.OUT)

    def on(self, params):
        gpio.output(self.pin, gpio.HIGH)

    def off(self, params):
        gpio.output(self.pin, gpio.LOW)

    def reset(self):
        gpio.output(self.pin, gpio.LOW)



class LimitSwitch(BaseController):
    def __init__(self, name, pin, state=False):
        self.name = name
        self.pin = pin
        self.state = state
        gpio.setup(self.pin, gpio.IN, pull_up_down=gpio.PUD_DOWN)

    def getStatus(self, params):
        state = gpio.input(self.pin)
        self.state = state
        return state

    def switchAction(self, motor, steps):
        pass

class HomeSwitch(BaseController):
    def __init__(self, name, pin, state=False):
        self.name = name
        self.pin = pin
        self.state = state
        gpio.setup(self.pin, gpio.IN, pull_up_down=gpio.PUD_DOWN)

    def getStatus(self, params):
        state = gpio.input(self.pin)
        self.state = state
        return state



class PushButton(BaseController):

    def __init__(self, name, pin, initialState=False, delay=0.1):
        self.pin = pin
        self.name = name
        self.delay = delay
        self.initialState = initialState
        gpio.setup(self.pin, gpio.OUT)
        if initialState:
            self.state = "on"
            gpio.output(self.pin, gpio.HIGH)
        else:
            self.state = "off"
            gpio.output(self.pin, gpio.LOW)

    def press(self, params):
        if self.initialState:
            gpio.output(self.pin, gpio.LOW)
            time.sleep(self.delay)
            gpio.output(self.pin, gpio.HIGH)
        else:
            gpio.output(self.pin, gpio.HIGH)
            time.sleep(self.delay)
            gpio.output(self.pin, gpio.LOW)


    def reset(self):
        gpio.output(self.pin, gpio.LOW)

class PWMChannel(BaseController):

    def __init__(self, name, pin, frequency, defaultDutyCycle=0 ):
        self.name = name
        self.device_type = "controller"
        self.pin = pin
        self.frequency = frequency
        self.defaultDutyCycle = defaultDutyCycle
        self.dutyCycle = defaultDutyCycle
        gpio.setup(self.pin, gpio.OUT)
        self.pwm = gpio.PWM(self.pin, self.frequency)
        self.pwm.start(self.dutyCycle)
        self.state = {}

    def power(self, dutyCycle):
        self.pwm.ChangeDutyCycle(dutyCycle)

    def power_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "power")
        dutyCycle = float(params[0])
        if dutyCycle < 0 or dutyCycle > 100:
            raise ArgumentError(self.name, "power", dutyCycle, allowed="0 <= dutyCycle <= 100")
        return dutyCycle

    def reset(self):
        self.pwm.ChangeDutyCycle(self.defaultDutyCycle)

class S42CStepperMotor(BaseController):
    """
    !There are no argument type check for this class!
    TODO Barry (chutian_wang@ucsb.edu) if checks became necessary.

    args: 
        name -- str: the name of this motor.
        EN -- int: the enable pin port.
        STEP -- int: the step pin port.
        DIR -- int: the direction pin port.
        bounds -- tuple: the limiting step bounds beyond which the
            motor should not reach, (LB, UB). Set to (None, None)
            If there are no restrictions (NOT RECOMMENDED). LB
            and UB are steps relative to initial position. If
            LB > 0 or UB < 0 initializaition will fail.

    kwargs:
        refPoints -- dict({}): A table of predefined reference points
            that can be quickly accessed by calling the `goto()`
            function. {str: int}
        delay -- float(0.02): the step pulse period in seconds.
        microstep -- int(2): the microstep setting on the motor.
            Choose a higher value if more precision is needed.
            This parameter is currently NOT USED. TODO Barry
            if it needs to be implemented.
        pi -- any(None): the host Rpi pigpio.pi instance. Default None
            will use the local host pi.
    
    The S24CStepperMotor shares the same controls as the StepperI2C motor.
    It has the following `microStep` settings on the OLED menu:

        2 -- 400  steps per rev or 0.9 degrees per microstep.
        4 -- 800  steps per rev or 0.45 degrees per microstep.
        8 -- 1600 steps per rec or 0.225 degrees per microstep.

    Hihger microsteps are 16, 32, 64, 128, 256.
    Note: more steps usually results in less torque but higher precision.

    Bound crossing handling:
        If any bounds are hit, the original move steps will be registered
        internally but the physical motor will not pass through the bound.
        If curPos is not within the bounds, any moves that attempt to push
        the motor further from the bounds range will not have physical
        effect.
        e.g. UB = 100, curPos = 0, move(101) will set curPos to 101 and
        send 100 step pulses to the motor.
        e.g. UB = 100, curPos = 200, move(10) will set curPos to 210 and
        send 0 step pulses to the motor.
        e.g. UB = 100, curPos = 200, move(-150) will set curPos to 50 and
        send 50 step pulses to the motor.

    Multithreading/Callback support:
        None, TODO barry if required in the future.
    """

    def __init__(
            self,
            name:   str,
            EN:     int,
            STEP:   int,
            DIR:    int,
            bounds: tuple,
            refPoints   = {},
            microstep   = 2,
            gearRatio   = 1,
            _pi         = None,
            stepWaitTime= 0
        ):

        self.name       = name
        self.EN         = EN
        self.STEP       = STEP
        self.DIR        = DIR
        self.LB     = bounds[0]
        self.UB     = bounds[1]
        # Bounds warning logic, remove if unecessary to improve performance
        if self.LB == None or self.UB == None:
            if self.LB == None and self.UB == None:
                warn(self.name + " is initialized without any bounds!", RuntimeWarning)
            elif self.LB == None:
                warn(self.name + " is initialized without a lower bound.", RuntimeWarning)
            elif self.UB == None:
                warn(self.name + " is initialized without a upper bound.", RuntimeWarning)
        else:
            if self.LB > self.UB:
                warn(self.name + " is initialized with LB > UB!", RuntimeWarning)
            if self.LB > 0:
                warn(self.name + " is initialized with a positive lower bound.", RuntimeWarning)
            if self.UB < 0:
                warn(self.name + " is initialized with a negative lower bound.", RuntimeWarning)
        self.refPoints  = refPoints
        self.delay      = 0.0001
        self.mStep      = microstep
        self.gearRatio  = gearRatio
        self.stepWaitTime   = stepWaitTime
        # The host Rpi, in case multihost systems are used in the future
        if not _pi:
            self.pi = pi
        else:
            self.pi = _pi
            warn("Foreign controls may not be supported.", RuntimeWarning)

        # The home position (TODO future update)
        self.homePos = 0
        # The ideal current position.
        self.curPos = 0

        self.pi.set_mode(self.STEP, pigpio.OUTPUT)
        self.pi.set_pull_up_down(self.STEP, pigpio.PUD_DOWN)
        self.pi.set_mode(self.EN, pigpio.OUTPUT)
        self.pi.set_pull_up_down(self.EN, pigpio.PUD_UP)
        self.pi.set_mode(self.DIR, pigpio.OUTPUT)
        self.pi.set_pull_up_down(self.DIR, pigpio.PUD_DOWN)

        # Always enable closed loop control. EN is active low.
        self.pi.write(self.EN, 0)
        self.state = {"position": self.curPos}
    
    def move_parser(self, params: list) -> int:
        """
        args:
            params -- iterable(list): The parameter list that contains cmd strings.

        ret:
            int: The number of steps to move.

        Will throw ArgumentNumberError if len(params) != 1.
        """
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "move")
        return int(params[0])

    def goto_parser(self, params: list):
        """
        args:
            params -- iterable(list): The parameter list that contains cmd strings.

        ret:
            str: The target refPoint.

        Will throw ArgumentNumberError if len(params) != 1.
        """
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        return params[0]

    def degMove_parser(self, params: list):
        """
        args:
            params -- iterable(list): The parameter list that contains cmd strings.

        ret:
            str: The target refPoint.

        Will throw ArgumentNumberError if len(params) != 1.
        """
        try:
            deg = float(params[0])
        except ValueError:
            raise ArgumentError(self.name, "degMove", params)
        return deg

    def __sqGenPWM(self, pin, period, num):
        pOn = pigpio.pulse(1<<self.STEP, 0, int(self.delay*1e6/2))
        pOff = pigpio.pulse(0, 1<<self.STEP, int(self.delay*1e6/2))
        pulse = [pOn, pOff]
        pi.wave_clear()
        pi.wave_add_generic(pulse)
        stepWave = pi.wave_create()

        absteps = abs(num)
        step_y = absteps//256
        step_x = absteps%256

        pi.wave_chain([
            255, 0,
            stepWave,
            255, 1,
            step_x, step_y
        ])

        while pi.wave_tx_busy():
            time.sleep(0.1)

    def move(self, steps: int):
        """
        args:
            steps -- int: The desired number of steps to move.

        ret:
            str: A response string ("{self.name}/position/{self.state["position"]}"
            or "{self.name}/position/limit").

        Attemps to move `steps` number of steps. Will stop if any bounds are hit. See
        class documentation `Bound crossing handling` for details.
        """
        # bounds checking decision tree.
        # optimize this with LUT if better performance is desiered
        targetPos = self.curPos + steps

        if self.LB == None and self.UB == None:
            moveSteps = steps

        elif self.LB == None:
            if self.curPos < self.UB:
                if targetPos <= self.UB:
                    moveSteps = targetPos - self.curPos
                else: # targetPos > self.UB
                    moveSteps = self.UB - self.curPos
            
            if self.curPos >= self.UB:
                if targetPos <= self.UB:
                    moveSteps = targetPos - self.UB
                else: # targetPos > self.UB
                    moveSteps = 0

        elif self.UB == None:
            if self.curPos <= self.LB:
                if targetPos < self.LB:
                    moveSteps = 0
                else: # targetPos >= self.LB
                    moveSteps = targetPos - self.LB

            if self.curPos > self.LB:
                if targetPos < self.LB:
                    moveSteps = self.LB - self.curPos
                else: # targetPos >= self.LB:
                    moveSteps = targetPos - self.curPos

        else:
            if self.curPos <= self.LB:
                if targetPos < self.LB:
                    moveSteps = 0
                elif targetPos >= self.LB and targetPos <= self.UB:
                    moveSteps = targetPos - self.LB
                else: # targetPos > self.UB
                    moveSteps = self.UB - self.LB

            if self.curPos > self.LB and self.curPos < self.UB:
                if targetPos < self.LB:
                    moveSteps = self.LB - self.curPos
                elif targetPos >= self.LB and targetPos <= self.UB:
                    moveSteps = targetPos - self.curPos
                else: # targetPos > self.UB
                    moveSteps = self.UB - self.curPos
            
            if self.curPos >= self.UB:
                if targetPos < self.LB:
                    moveSteps = self.LB - self.UB
                elif targetPos >= self.LB and targetPos <= self.UB:
                    moveSteps = targetPos - self.UB
                else: # targetPos > self.UB
                    moveSteps = 0
        
        # set DIR pin
        if moveSteps >= 0:
            self.pi.write(self.DIR, 1)
        else:
            self.pi.write(self.DIR, 0)

        self.__sqGenPWM(self.STEP, self.delay, abs(moveSteps))
        time.sleep(self.stepWaitTime * abs(moveSteps))
        
        # update self.curPos and self.state
        self.curPos = targetPos
        self.state["position"] += moveSteps
        
        if self.state["position"] == self.UB or self.state["position"] == self.LB:
            return "{0}/{1}/{2}".format(self.name, "position", "limit")
        else:
            return "{0}/{1}/{2}".format(self.name, "position", self.state["position"])
    
    def goto(self, ref: str, safe = True):
        """
        args:
            ref -- int: The target refPoint.
            safe -- bool(True): If `safe` is set True, the motor will not attempt
                to move to a refpoint beyond the bounds. Otherwise it will stop at 
                the bound.

        ret:
            str: A response string ("{self.name}/position/{self.state["position"]}"
            or "{self.name}/position/limit").

        Attemps to move to the target refPoint. Will stop if any bounds are hit. See
        class documentation `Bound crossing handling` for details.
        """
        if safe and (self.refPoints[ref] > self.UB or self.refPoints[ref] < self.LB):
            warn(self.name + " refPoint out of bounds, move canceled.", RuntimeWarning)
            return "{0}/{1}/{2}".format(self.name, "position", self.state["position"])
        else:
            target = self.refPoints[ref]
            return self.move(target - self.curPos)
        
    def reset(self):
        return self.move(-self.curPos)

class FS5103RContinuousMotor(BaseController):

    def __init__(self, name, PWM, limitPin = None, _reversed = False, pi = None):
        """
        This is the controller for the FS5103R continuous motor used on the gamma labs.
        When active (default, not disabled) this motor will use one of the PWM channels.
        This controller is made compatable with any code that uses the same commands as
        the PololuDCMotor. It also has an additional `disable` method that will stop the
        PWM output and release the PWM channel. The motor will stop as soon as a limit
        is triggered (limit pin pulled high).
        args: 
            name -- str: the name of this motor.
            PWM -- int: the PWM pin for the motor.

        kwargs:
            pi -- any(None): the host Rpi pigpio.pi instance. Default None
                will use the local host pi.
            limitPin -- int/(None): the limit interrupt pin for the motor. Default None will
                not have any limit protection.
            _reversed -- bool(False): if the motor's direction should be _reversed set this to True.
        """
        self.name = name
        self.PWM = PWM
        self.limitPin = limitPin
        self._reversed = _reversed
        # The host Rpi, in case multihost systems are used in the future
        if not pi:
            self.pi = pigpio.pi()
        else:
            self.pi = pi
            warn("Foreign controls may not be supported.", RuntimeWarning)

        self.pi.set_mode(self.PWM, pigpio.OUTPUT)
        self.pi.set_pull_up_down(self.PWM, pigpio.PUD_DOWN)

        # Set the callback trigger pin, the callback function, and the
        # glitch filter for the limit switch
        if self.limitPin != None:
            self.pi.set_mode(self.limitPin, pigpio.INPUT)
            self.pi.set_glitch_filter(limitPin, 50)
            self.stopCallback   = self.pi.callback(limitPin, pigpio.RISING_EDGE, self.__stop)
            self.startCallback  = self.pi.callback(limitPin, pigpio.FALLING_EDGE, self.__resetCallback)
            self.pi.set_mode(self.PWM, pigpio.INPUT)
            self.pi.set_pull_up_down(self.PWM, pigpio.PUD_DOWN)
        self.state = {"running": False, "throttle": 0}


    def throttle(self, throttle):
        """
        args:
            throttle -- int: desired percent speed in the range [-1.0, 1.0],
                1.0 sets the speed fully forwards and -1.0 sets the speed
                fully backwards. 0 is stall.
        """
        self.state["running"] = True
        self.pi.set_mode(self.PWM, pigpio.OUTPUT)
        dutyCycle = int(1500 + throttle * 1000)
        self.pi.set_servo_pulsewidth(self.PWM, dutyCycle)
        self.state["throttle"] = throttle
        return self.state

    def __stop(self, gpio, level, tick):
        self.stopCallback.cancel()
        self.startCallback = self.pi.callback(self.limitPin, pigpio.FALLING_EDGE, self.__resetCallback)
        #print(self.name, f"has reached its limit. status {level}")
        self.throttle(0)
        
    def __resetCallback(self, gpio, level, tick):
        self.startCallback.cancel()
        self.stopCallback = self.pi.callback(self.limitPin, pigpio.RISING_EDGE, self.__stop)
        #print(self.name, f"stop callback reset. status {level}")

    def disable(self):
        self.pi.set_mode(self.PWM, pigpio.INPUT)
        self.state["running"]   = False
        self.state["throttle"]  = 0.
        return self.state

    def throttle_parser(self, params):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "setSpeed")
        throttle = float(params[0])
        if self._reversed:
            throttle = - throttle
        if throttle < -1 or throttle > 1:
            raise ArgumentError(self.name, "throttle", throttle, allowed="-1 <= throttle <= 1")
        return throttle

class GeneralPWMServo(BaseController):
    def __init__(self, name, PWM, pi = None):
        """
        This is a control class for generic PWM controlled 180 degrees
        servo.
        args: 
            name -- str: the name of this servo.
            PWM -- int: the PWM pin for the servo.

        kwargs:
            pi -- any(None): the host Rpi pigpio.pi instance. Default None
                will use the local host pi.
        """
        self.name = name
        self.PWM = PWM
        if not pi:
            self.pi = pigpio.pi()
        else:
            self.pi = pi
            warn("Foreign controls may not be supported.", RuntimeWarning)
        
        self.pi.set_mode(self.PWM, pigpio.OUTPUT)
        self.pi.set_pull_up_down(self.PWM, pigpio.PUD_DOWN)
        self.state = {"running": False, "angle": 0}

    def goto_parser(self, params: list):
        if len(params) != 1:
            raise ArgumentNumberError(len(params), 1, "goto")
        try:
            return float(params[0])
        except:
            raise ArgumentError(self.name, "goto", params[0], float)

    def goto(self, angle):
        """
        This method will use one of the PWM channels on the pi to control
        the servo.
        args:
            angle -- float: The target angle, this angle must be between +90
                and -90.
        """
        self.state["running"] = True
        self.pi.set_mode(self.PWM, pigpio.OUTPUT)
        if angle < -90 or angle > 90:
            raise ArgumentError(self.name, "goto", angle, allowed = "-90 < angle < 90")
        dutyCycle = int(1500 + angle / 90 * 1000)
        self.pi.set_servo_pulsewidth(self.PWM, dutyCycle)
        self.state["angle"] = angle
        return self.state

    def disable(self):
        """
        This method will stop the servo control and free up the PWM channel.
        The servo will usually stop in place but this is technically undefined
        behavior.
        """
        self.pi.set_mode(self.PWM, pigpio.INPUT)
        self.state["running"] = False
        return self.state

# #Ziyan Code Goes Here
# class ServoAngleMotor(BaseController):
#     def __init__(self, name, pin,defaultpulsewidth = 0, bounds=None):
#         #Ziyan puts parameters needed for servo here
#         # i.e. Set up PWM channel, set default PWM duty cycle and frequency.
#         self.pin = pin
#         self.name = name
#         self.frequency = frequency
#         self.pulsewidth = defaultpulsewidth
#         self.device_type = "controller"
#         pi.set_servo_pulsewidth(self.pin, self.pulsewidth)
#         self.stepPin = stepPin
#         self.directionPin = directionPin
#         self.enablePin = enablePin
        
#         pi.set_mode(self.stepPin, pigpio.OUTPUT)
#         pi.set_pull_up_down(self.stepPin, pigpio.PUD_DOWN)
#         pi.set_mode(self.enablePin, pigpio.OUTPUT)
#         pi.set_pull_up_down(self.enablePin, pigpio.PUD_DOWN)
#         pi.set_mode(self.directionPin, pigpio.OUTPUT)
#         pi.set_pull_up_down(self.directionPin, pigpio.PUD_DOWN)
        
#         pi.write(self.enablePin, 0)
        
#         if bounds is None:
#             self.lowerBound = 0
#             self.upperBound = 180
#         else:
#             self.lowerBound = bounds[0]
#             self.upperBound = bounds[1]
            

#     def goto(self, angle):
#         ## Code to set duty cycle on PWM channel
#         self.pulsewidth = 2000/180*angle + 500
#         pi.set_servo_pulsewidth(self.pin, sefl.pulsewidth)
        


#     def goto_parser(self, params):
#         if len(params) != 1:
#             raise ArgumentNumberError(len(params), 1, "goto")
#         angle = int(params[0])
#         ## Code here that translates between angle (params[0]) and duty cycle needed for PWM.
#         if angle < 0 or angle > 180:
#             raise ArgumentError(self.name, "goto", angle, allowed="0 <= angle <= 180")
#         return angle

#     class ServoSpeedMotor(BaseController):
#     def __init__(self, name, pin,defaultpulsewidth = 0):
#         #Ziyan puts parameters needed for servo here
#         # i.e. Set up PWM channel, set default PWM duty cycle and frequency.
#         self.pin = pin
#         self.name = name
#         self.frequency = frequency
#         self.device_type = "controller"
#         self.frequency = frequency
#         self.pulsewidth = defaultpulsewidth
#         self.device_type = "controller"
#         pi.set_servo_pulsewidth(self.pin, self.pulsewidth)
        
    
#     def goto(self, speed):
#         if speed >= 0:
#              gpio.output(self.directionPin, 1)
#         else:
#             gpio.output(self.directionPin, 0)
            
#         pi.write(self.directionPin, speed<=0)
        
#         # The relationship between pulsewiteh and speed just as angle
#         speed = 951.5365153687828/(1+np.exp(-0.013258915407307536*(x-1495.0847846147005)))+-480.9992281790085
    





#     def goto_parser(self, params):
#         if len(params) != 1:
#             raise ArgumentNumberError(len(params), 1, "goto")
#         speed = int(params[0])

#         if speed < -self.pwmScaler or speed > self.pwmScaler:
#             raise ArgumentError(self.name, "goto", speed/self.pwmScaler, "-1 <= speed <= 1")

#         return speed



class CommandError(Exception):

    def __init__(self, command, *args):
        self.command = command
        if args:
            self.message = args[0]
        else:
            self.message = "No command named '{0}' found".format(self.command)

    def __str__(self):
        return "CommandError, {0}".format(self.message)

class ArgumentNumberError(Exception):
    def __init__(self, total_args, allowed, command=None):
        self.total_args = total_args
        self.allowed = allowed
        self.command = command

    def __str__(self):
        if self.command is None:
            return "ArgumentNumberError, received {0} when {1} was expected.".format(self.total_args, self.allowed)
        else:
            return "ArgumentNumberError, command '{0}' received {1} when {2} was expected.".format(self.command,
             self.total_args, self.allowed)

class ArgumentError(Exception):
    def __init__(self, device_name, command, received, allowed=None):
        self.device_name = device_name
        self.command = command
        self.allowed = allowed
        self.received = received

    def __str__(self):
        if self.allowed is None:
            return "ArgumentError, Device, {0}, can't process command argument {1} by command {2}.".format(self.device_name, self.received, self.command)
        else:
            return "ArgumentError, Argument {0}, is not one of the allowed commands, {1}, for device, {2}, running command {3}.".format(self.received, self.allowed, self.device_name, self.command)
