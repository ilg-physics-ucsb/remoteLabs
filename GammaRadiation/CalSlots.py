import json, os
import RemlaGUI as GUI
from labcontrol import S42CStepperMotor as S42C

# main
MAIN_TITLE  = "S42C Stage Calibration For the Gamma Lab"
AUTHOR_DATE =            "Barry Wang, 2023"

OPT1        =      "1. Start NEW Calibration"
OPT2        =      "2. Recalibrate Offset"
OPT3        =      "3. Test Calibration"
OPT4        =      "4. Quit"

# load file
LOAD        = "Load/Save Settings"

#                buttons

CONF        =   "Confirm"
CANCEL      =   "Cancel"

#           --info bar here--

# newCal
NEWCAL_TITLE    = "Create NEW stage calibration"
COARSE          = "COARSE"
FINE            =                         "FINE"
#                        some labels...
MOVE_L          = "<--"
MOVE_R          =                          "-->"

REGISTER        =      "Generate New Config"
ABORT           =            "Abort"

HOME            =            "Set Home"
S0              = "Set S0"
S5              = "Set S5"
H0              =                       "Set H0"
H14             =                      "Set H14"
#                         bot info bar


def loadFile(btn, window, filename, textbar, confbtn):
    with open(filename, "r") as f:
        labSettings = json.load(f)
    try:
        stageStepPin, stageDirPin, stageEnPin = labSettings['stagePins']
        textbar.updateText(f"Loaded settings: STEP-{stageStepPin}, DIR-{stageDirPin}, EN-{stageEnPin}")
        window.popStack()
        window.pushStack(labSettings)
        window.unhideWidget(confbtn)
    except Exception as inst:
        window.popStack()
        window.pushStack(None)
        textbar.updateText("Load failed:" + str(inst))
        window.hideWidget(confbtn)

def cancelLoad(btn, window, app):
    app.popWindow()
    app.popWindow()

def confLoad(btn, window, newcal_window, app):
    data = window.popStack()
    newcal_window.pushStack(data)
    app.popWindow()

def setMotor(window, app, coarsebtn):
    if not window.varMap.setdefault("motor_set", False):
        window.varMap["motor_set"] = True
        window.REG_A = window.popStack() # config data
        window.REG_B = 0 # steps
        window.REG_X = 1000 # step increment
        window.highlightWidget(coarsebtn)
        STEP, DIR, EN = window.REG_A['stagePins']
        window.REG_Y = S42C("stage", EN, STEP, DIR, (None, None))
        window.pushMap("h0", None)
        window.pushMap("h14", None)
        window.pushMap("s0", None)
        window.pushMap("s5", None)
        window.pushMap("home", None)

def setCoarse(btn, window, finebtn):
    window.highlightWidget(btn)
    window.unhighlightWidget(finebtn)
    window.REG_X = 1000

def setFine(btn, window, coarsebtn):
    window.highlightWidget(btn)
    window.unhighlightWidget(coarsebtn)
    window.REG_X = 10
    
def moveL(btn, window, posbar, infobar):
    window.REG_B -= window.REG_X
    window.REG_Y.move(-window.REG_X) # comment out when testing
    infobar.updateText(f"Steped {window.REG_X} in the NEGATIVE direction.")
    posbar.updateText(f"Current position: {window.REG_B} steps")

def moveR(btn, window, posbar, infobar):
    window.REG_B += window.REG_X
    window.REG_Y.move(window.REG_X) # comment out when testing
    infobar.updateText(f"Steped {window.REG_X} in the POSITIVE direction.")
    posbar.updateText(f"Current position: {window.REG_B} steps")

def abort(btn, window, app):
    app.popWindow()

def setHome(btn, window, infobar):
    window.highlightWidget(btn)
    infobar.updateText(f"Home is set to current position.")
    window.varMap["home"] = window.REG_B

def setS0(btn, window, infobar):
    window.highlightWidget(btn)
    infobar.updateText(f"S0 is set to current position.")
    window.varMap["s0"] = window.REG_B

def setS5(btn, window, infobar):
    window.highlightWidget(btn)
    infobar.updateText(f"S5 is set to current position.")
    window.varMap["s5"] = window.REG_B

def setH0(btn, window, infobar):
    window.highlightWidget(btn)
    infobar.updateText(f"H0 is set to current position.")
    window.varMap["h0"] = window.REG_B

def setH14(btn, window, infobar):
    window.highlightWidget(btn)
    infobar.updateText(f"H14 is set to current position.")
    window.varMap["h14"] = window.REG_B

def registerConfig(btn, window, infobar, saveWindow, app):
    if window.varMap["home"] != None and\
       window.varMap["s0"] != None and\
       window.varMap["s5"] != None and\
       window.varMap["h0"] != None and\
       window.varMap["h14"] != None:
        
        saveWindow.REG_Y = window.REG_Y
        saveWindow.pushStack(None)
        saveWindow.varMap = window.varMap
        app.pushWindow(saveWindow)
    else:
        infobar.updateText("Need to set all positions before generating.")

def cancelSave(btn, window, app):
    app.popWindow()

def saveFile(btn, window, filename, textbar, confbtn):
    with open(filename, "r") as f:
        labSettings = json.load(f)
    try:
        if "stageRefPoints" in labSettings.keys():
            textbar.updateText(f"Will overwrite the current stage refPoints.")
        else:
            textbar.updateText(f"Will create new stage refPoints.")
        window.popStack()
        window.pushStack((filename, labSettings))
        window.unhideWidget(confbtn)
    except Exception as inst:
        window.popStack()
        textbar.updateText("Open failed:" + str(inst))
        window.hideWidget(confbtn)

def confSave(btn, window, textbar):
    filename, labSettings = window.popStack()
    home = window.varMap["home"]
    s0 = window.varMap["s0"]
    s5 = window.varMap["s5"]
    h0 = window.varMap["h0"]
    h14 = window.varMap["h14"]

    for slotNum in range(0, 6):
        key = 's' + str(slotNum)
        labSettings["stageRefPoints"][key] = s0 + int((s5 - s0) * slotNum / 5) - home

    for absorberNum in range(0, 16):
        key = 'h' + str(absorberNum)
        labSettings["stageRefPoints"][key] = h0 + int((h14 - h0) * absorberNum / 5) - home

    try:
        with open(filename, "w") as f:
            json.dump(labSettings, f)
        textbar.updateText(f"Successfully saved to \"{filename}\" and moved stage to home.")
        window.REG_Y.move(-home)
    except:
        textbar.updateText("SAVE FAILED")

def newCal(btn, window, app):

    # These are for loading/saving settings
    dirList         = os.listdir()
    dirList         = [file for file in dirList if file[-5:] == ".json"]
    newcal_window   = GUI.Window()
    load_window     = GUI.Window()
    load_window.pushStack(None)
    load_title      = GUI.Label(text = LOAD,
                            color = GUI.CYAN_BLACK,
                            pos = GUI.SCALE(0.3, 0),
                            x_centered = True)
    load_textbar    = GUI.Bar(text = "Select a file...",
                              color = GUI.RED_WHITE, pos = GUI.BOT_LEFT)
    
    load_conf       = GUI.Button(text = CONF,
                                 pos = GUI.SCALE(0.4, 0) + (len(dirList) + 2, 0),
                                 x_centered = True)
    
    load_cancel     = GUI.Button(text = CANCEL,
                                 pos = GUI.SCALE(0.4, 0) + (len(dirList) + 3, 0),
                                 x_centered = True)

    for idx, filename in enumerate(dirList):
        btn = GUI.Button(text = str(idx + 1) + '. ' + filename,
                         pos = GUI.SCALE(0.4, 0) + (idx, 0),
                         x_centered = True,
                         color = GUI.YELLOW_BLACK,
                         sl_color = GUI.YELLOW_WHITE)
        btn.setFunc(loadFile, filename, load_textbar, load_conf)
        load_window.addWidget(btn)
    
    load_cancel.setFunc(cancelLoad, app)
    load_conf.setFunc(confLoad, newcal_window, app)

    load_window.addWidget(load_title)
    load_window.addWidget(load_textbar)
    load_window.addWidget(load_conf)
    load_window.addWidget(load_cancel)

    load_window.hideWidget(load_conf)

    # These are for actual calibration
    newcal_title    = GUI.Label(text = NEWCAL_TITLE,
                                color = GUI.CYAN_BLACK,
                                pos = GUI.TOP_LEFT,
                                x_centered = True)
    newcal_infobar  = GUI.Bar(pos = GUI.BOT_LEFT)
    newcal_barlabel = GUI.Label(pos = GUI.SCALE(1, 0) - (3, 0), color = GUI.CYAN_BLACK, text = "Information")
    newcal_posbar   = GUI.Bar(pos = GUI.SCALE(1, 0) - (2, 0), color = GUI.CYAN_WHITE)
    newcal_coarsebtn= GUI.Button(text = COARSE,
                                hl_color = GUI.YELLOW_BLACK,
                                pos = GUI.SCALE(0.1, 0.5) + (0, 10 - len(COARSE) // 2))
    newcal_finbtn   = GUI.Button(text = FINE,
                                hl_color = GUI.YELLOW_BLACK,
                                pos = GUI.SCALE(0.1, 0.5) - (0, 10 + len(FINE) // 2))
    
    newcal_moveRbtn = GUI.Button(text = MOVE_R,
                                pos = GUI.SCALE(0.1, 0.5) + (2, 15 - len(MOVE_L) // 2))
    newcal_moveLbtn = GUI.Button(text = MOVE_L,
                                pos = GUI.SCALE(0.1, 0.5) - (-2, 15 + len(MOVE_R) // 2))
    
    newcal_abortbtn = GUI.Button(text = ABORT,
                                pos = GUI.SCALE(1, 0) - (4, 0),
                                x_centered = True)
    
    newcal_homebtn  = GUI.Button(text = HOME,
                                 pos = GUI.SCALE(1, 0) - (7, 0),
                                 x_centered = True, hl_color = GUI.GREEN_BLACK)
    newcal_s0btn    = GUI.Button(text = S0,
                                 pos = GUI.SCALE(1, 0.5) - (6, 10 + len(S0) // 2),
                                 hl_color = GUI.GREEN_BLACK)
    newcal_s5btn    = GUI.Button(text = S5,
                                 pos = GUI.SCALE(1, 0.5) + (-6, 10 - len(S5) // 2),
                                 hl_color = GUI.GREEN_BLACK)
    newcal_h0btn    = GUI.Button(text = H0,
                                 pos = GUI.SCALE(1, 0.5) - (5, 10 + len(H0) // 2),
                                 hl_color = GUI.GREEN_BLACK)
    newcal_h14btn   = GUI.Button(text = H14,
                                 pos = GUI.SCALE(1, 0.5) + (-5, 10 - len(H14) // 2),
                                 hl_color = GUI.GREEN_BLACK)

    newcal_regbtn   = GUI.Button(text = REGISTER,
                                 pos = GUI.SCALE(0.5, 0),
                                 x_centered = True)
    
    newcal_homebtn.setFunc(setHome, newcal_infobar)
    newcal_s0btn.setFunc(setS0, newcal_infobar)
    newcal_s5btn.setFunc(setS5, newcal_infobar)
    newcal_h0btn.setFunc(setH0, newcal_infobar)
    newcal_h14btn.setFunc(setH14, newcal_infobar)

    newcal_moveRbtn.setFunc(moveR, newcal_posbar, newcal_infobar)
    newcal_moveLbtn.setFunc(moveL, newcal_posbar, newcal_infobar)
    newcal_coarsebtn.setFunc(setCoarse, newcal_finbtn)
    newcal_finbtn.setFunc(setFine, newcal_coarsebtn)
    newcal_abortbtn.setFunc(abort, app)


    # these are for saving
    save_window     = GUI.Window()
    save_title      = GUI.Label(text = "Save Stage Position Configs",
                            color = GUI.CYAN_BLACK,
                            pos = GUI.SCALE(0.3, 0),
                            x_centered = True)
    save_textbar    = GUI.Bar(text = "Select a file...",
                              color = GUI.RED_WHITE, pos = GUI.BOT_LEFT)
    
    save_conf       = GUI.Button(text = CONF,
                                 pos = GUI.SCALE(0.4, 0) + (len(dirList) + 2, 0),
                                 x_centered = True)
    
    save_cancel     = GUI.Button(text = CANCEL,
                                 pos = GUI.SCALE(0.4, 0) + (len(dirList) + 3, 0),
                                 x_centered = True)
    
    for idx, filename in enumerate(dirList):
        btn = GUI.Button(text = str(idx + 1) + '. ' + filename,
                         pos = GUI.SCALE(0.4, 0) + (idx, 0),
                         x_centered = True,
                         color = GUI.YELLOW_BLACK,
                         sl_color = GUI.YELLOW_WHITE)
        btn.setFunc(saveFile, filename, save_textbar, save_conf)
        save_window.addWidget(btn)
    
    save_cancel.setFunc(cancelSave, app)
    save_conf.setFunc(confSave, save_textbar)

    save_window.addWidget(save_title, save_textbar, save_conf, save_cancel)
    save_window.hideWidget(save_conf)

    newcal_regbtn.setFunc(registerConfig, newcal_infobar, save_window, app)

    newcal_window.addWidget(newcal_title,
                            newcal_barlabel,
                            newcal_posbar,
                            newcal_infobar,
                            newcal_coarsebtn,
                            newcal_finbtn,
                            newcal_moveLbtn,
                            newcal_moveRbtn,
                            newcal_abortbtn,
                            newcal_homebtn,
                            newcal_s0btn,
                            newcal_s5btn,
                            newcal_h0btn,
                            newcal_h14btn,
                            newcal_regbtn)
    newcal_window.setActiveCallback(setMotor, newcal_coarsebtn)

    app.pushWindow(newcal_window)
    app.pushWindow(load_window)

def quitApp(btn, window, app):
    app.quit()

main_window = GUI.Window()
app = GUI.Application([main_window])

main_title  = GUI.Label(text = MAIN_TITLE,
                        color = GUI.CYAN_BLACK,
                        pos = GUI.SCALE(0.5, 0) - (3, 0),
                        x_centered = True)
main_author = GUI.Label(text = AUTHOR_DATE,
                        color = GUI.CYAN_BLACK,
                        pos = GUI.SCALE(0.5, 0) - (2, 0),
                        x_centered = True)
main_newbtn = GUI.Button(text = OPT1,
                         pos = GUI.SCALE(0.5, 0.5) + (1, -int(len(OPT1)//2)))
main_rebtn  = GUI.Button(text = OPT2,
                         pos = GUI.SCALE(0.5, 0.5) + (2, -int(len(OPT1)//2)))
main_testbtn= GUI.Button(text = OPT3,
                         pos = GUI.SCALE(0.5, 0.5) + (3, -int(len(OPT1)//2)))
main_qtbtn  = GUI.Button(text = OPT4,
                         pos = GUI.SCALE(0.5, 0.5) + (4, -int(len(OPT1)//2)))

main_newbtn.setFunc(newCal, app)
main_qtbtn.setFunc(quitApp, app)

main_window.addWidget(main_title, main_author, main_newbtn, main_rebtn, main_testbtn, main_qtbtn)

app.run()