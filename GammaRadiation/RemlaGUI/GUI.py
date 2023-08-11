import curses
from .consts import *

class Widgets(object):
    
    def __init__(self, __type, **kwargs):
        self.__type = __type
        kwargs.setdefault("x_centered", False)
        kwargs.setdefault("y_centered", False)
        kwargs.setdefault("pos", (0, 0))    #(y, x)
        kwargs.setdefault("height", None)
        kwargs.setdefault("width", None)
        kwargs.setdefault("color", WHITE_BLACK)
        kwargs.setdefault("hl_color", BLACK_WHITE)
        kwargs.setdefault("sl_color", BLACK_WHITE)
        kwargs.setdefault("text", "")
        self.attrs = kwargs

        self.selectable     = False
        self.highlightable  = False

        self.width  = 0
        self.height = 0

        self.parentWindow = None
    
    def getPos(self):
        window = self.parentWindow
        height, width = window.stdscr.getmaxyx()
        if type(self.attrs["pos"]) == SCALE:
            scale = self.attrs["pos"]
            y = int(height * scale.y_scale + scale.y_offset)
            x = int(width * scale.x_scale + scale.x_offset)
        elif self.attrs["pos"] == TOP_LEFT:
            y = 0
            x = 0
        elif self.attrs["pos"] == TOP_RIGHT:
            y = 0
            x = window.stdscr.getmaxyx()[1] - self.width
        elif self.attrs["pos"] == BOT_LEFT:
            y = window.stdscr.getmaxyx()[0] - self.height
            x = 0
        elif self.attrs["pos"] == BOT_RIGHT:
            y = window.stdscr.getmaxyx()[0] - self.height
            x = window.stdscr.getmaxyx()[1] - self.width
        else:
            y = self.attrs["pos"][0]
            x = self.attrs["pos"][1]

        if self.attrs["x_centered"]:
            x = int((width // 2) - (len(self.attrs["text"]) // 2) - len(self.attrs["text"]) % 2)
        if self.attrs["y_centered"]:
            y = int(height // 2)

        return (y, x)

    def render(self, highlight = False, selected = False):
        pass
    
    def highlight(self):
        pass

    def select(self):
        pass

    def unselect(self):
        pass

    def activate(self):
        pass

class Label(Widgets):
    def __init__(self, **kwargs):
        super().__init__(LABEL, **kwargs)
        self.highlightable = True
        self.width = len(self.attrs["text"]) + 1
        self.height = 1

    def render(self, highlight, selected):
        window = self.parentWindow
        height, width = window.stdscr.getmaxyx()
        y, x = super().getPos()
        if x < width and y < height and x >= 0 and y >= 0:
            color = self.attrs["color"]
            if highlight:
                color = self.attrs["hl_color"]
            window.stdscr.attron(curses.color_pair(color))
            window.stdscr.addstr(y, x, self.attrs["text"][:width - x - 1])
            window.stdscr.attroff(curses.color_pair(color))

class Bar(Widgets):
    def __init__(self, **kwargs):
        super().__init__(BAR, **kwargs)
        if self.attrs["color"] % 2 == 1:
            self.attrs["color"] += 1
        self.width = len(self.attrs["text"]) + 1
        self.height = 1

    def updateText(self, text):
        self.attrs["text"] = text
        self.width = len(self.attrs["text"]) + 1

    def render(self, highlight, selected):
        window = self.parentWindow
        height, width = window.stdscr.getmaxyx()
        y, x = super().getPos()
        if x < width and y < height and x >= 0 and y >= 0:
            color = self.attrs["color"]
            window.stdscr.attron(curses.color_pair(color))
            window.stdscr.addstr(y, 0, ' ' * x)
            window.stdscr.addstr(y, x, self.attrs["text"][:width - x - 1])
            sLen = len(self.attrs["text"])
            if x + sLen < width:
                window.stdscr.addstr(y, x + sLen, ' ' * (width - x - sLen - 1))
            window.stdscr.attroff(curses.color_pair(color))

class Button(Widgets):
    def __init__(self, **kwargs):
        super().__init__(BUTTON, **kwargs)
        self.selectable     = True
        self.highlightable  = True
        self.width          = len(self.attrs["text"]) + 1
        self.height         = 1
        self.func           = self.__defaultFunc
        self.funcArgs       = ()
        self.funcKwargs     = {}

    def __defaultFunc(self, *args, **kwargs):
        pass

    def setFunc(self, func, *args, **kwargs):
        self.func = func
        self.funcArgs = args
        self.funcKwargs = kwargs

    def render(self, highlight, selected):
        window = self.parentWindow
        height, width = window.stdscr.getmaxyx()
        y, x = super().getPos()
        if x < width and y < height and x >= 0 and y >= 0:
            color = self.attrs["color"]
            if highlight:
                color = self.attrs["hl_color"]
            if selected:
                color = self.attrs["sl_color"]
            window.stdscr.attron(curses.color_pair(color))
            window.stdscr.addstr(y, x, self.attrs["text"][:width - x - 1])
            window.stdscr.attroff(curses.color_pair(color))
    
    def activate(self):
        self.func(self, self.parentWindow, *self.funcArgs, **self.funcKwargs)

class Window(object):
    def __init__(self, widgets = None, stdscr = None):
        self.stdscr         = stdscr
        self.selected       = None
        self.highlighted    = []
        self.hidden         = []
        self.varStack       = []
        self.varMap         = {}
        self.REG_A          = 0
        self.REG_B          = 0
        self.REG_X          = 0
        self.REG_Y          = 0
        self.active         = False
        self.activeCallback = self.__defaultCallback
        self.callbackArgs   = []
        self.callbackKwargs = {}

        if widgets == None:
            self.widgets = []
        else:
            self.widgets = widgets

        for widget in self.widgets:
            widget.parentWindow = self
            if widget.selectable == True and self.selected == None:
                self.selected = widget
    
    def __defaultCallback(self, window, app):
        pass

    def __getDisSq(self, wgt1, wgt2):
        y1, x1 = wgt1.getPos()
        y2, x2 = wgt2.getPos()
        return (x1 - x2) ** 2 + ((y1 - y2) * 2.5) ** 2

    def __getLeft(self, target):
        if target == None:
            return None

        y, x = target.getPos()
        left = [w for w in self.widgets if w.getPos()[1] < x and w not in self.hidden and w.selectable]
        if len(left) != 0:
            left_samerow = []
            for widget in left:
                if widget.getPos()[0] == target.getPos()[0]:
                    left_samerow.append(widget)
            if len(left_samerow) == 0:
                return min(left , key = lambda w: self.__getDisSq(w, target))
            else:
                return min(left_samerow , key = lambda w: self.__getDisSq(w, target))
        else:
            return target

    def __getRight(self, target):
        if target == None:
            return None
        
        y, x = target.getPos()
        right = [w for w in self.widgets if w.getPos()[1] > x and w not in self.hidden and w.selectable]
        if len(right) != 0:
            right_samerow = []
            for widget in right:
                if widget.getPos()[0] == target.getPos()[0]:
                    right_samerow.append(widget)
            if len(right_samerow) == 0:
                return min(right , key = lambda w: self.__getDisSq(w, target))
            else:
                return min(right_samerow , key = lambda w: self.__getDisSq(w, target))
        else:
            return target

    def __getUp(self, target):
        if target == None:
            return None
        
        y, x = target.getPos()
        up = [w for w in self.widgets if w.getPos()[0] < y and w not in self.hidden and w.selectable]
        if len(up) != 0:
            return min(up , key = lambda w: self.__getDisSq(w, target))
        else:
            return target

    def __getDown(self, target):
        if target == None:
            return None
        
        y, x = target.getPos()
        down = [w for w in self.widgets if w.getPos()[0] > y and w not in self.hidden and w.selectable]
        if len(down) != 0:
            return min(down , key = lambda w: self.__getDisSq(w, target))
        else:
            return target
        
    def addWidget(self, *args):
        for widget in args:
            widget.parentWindow = self
            self.widgets.append(widget)
            if widget.selectable:
                self.selected = widget
    
    def render(self):
        for widget in self.widgets:
            if widget not in self.hidden:
                widget.render(widget in self.highlighted, widget == self.selected)
        self.stdscr.refresh()
    
    def keypress(self, key):
        if key == None:
            return 0
        if key == curses.KEY_LEFT:
            self.selected = self.__getLeft(self.selected)
        if key == curses.KEY_RIGHT:
            self.selected = self.__getRight(self.selected)
        if key == curses.KEY_UP:
            self.selected = self.__getUp(self.selected)
        if key == curses.KEY_DOWN:
            self.selected = self.__getDown(self.selected)
        if key == ord('\n'):
            if self.selected != None:
                self.selected.activate()
            else:
                return -1
    
    def pushStack(self, x):
        self.varStack.append(x)

    def popStack(self):
        return self.varStack.pop()
    
    def peekStack(self):
        return self.varStack[-1]
    
    def stackEmpty(self):
        return len(self.varStack) == 0
    
    def pushMap(self, key, val):
        self.varMap[key] = val
    
    def getREG(self):
        return (self.REG_A, self.REG_B, self.REG_X, self.REG_Y)
    
    def hideWidget(self, widget):
        if widget not in self.hidden:
            self.hidden.append(widget)
            if self.selected == widget:
                self.selected = None
                for widget_ in self.widgets:
                    if widget.selectable:
                        self.selected = widget_
                        break
    
    def unhideWidget(self, widget):
        if widget in self.hidden:
            self.hidden.remove(widget)

    def highlightWidget(self, widget):
        if widget not in self.highlighted:
            self.highlighted.append(widget)
    
    def unhighlightWidget(self, widget):
        if widget in self.highlighted:
            self.highlighted.remove(widget)

    def setActiveCallback(self, func, *args, **kwargs):
        self.activeCallback = func
        self.callbackArgs = args
        self.callbackKwargs = kwargs

    def activate(self, app):
        if not self.active:
            self.activeCallback(self, app, *self.callbackArgs, **self.callbackKwargs)
        self.active = True


class SCALE(object):
    def __init__(self, y_scale, x_scale):
        self.x_scale = x_scale
        self.y_scale = y_scale
        self.x_offset = 0
        self.y_offset = 0
    
    def __add__(self, other):
        if type(other) == tuple:
            self.x_offset += other[1]
            self.y_offset += other[0]
            return self
        elif type(other) == SCALE:
            self.x_scale += other.x_scale
            self.y_scale += other.y_scale
            self.x_offset += other.x_offset
            self.y_offset += other.y_offset
            return self
        else:
            return self
    
    def __sub__(self, other):
        if type(other) == tuple:
            self.x_offset -= other[1]
            self.y_offset -= other[0]
            return self
        elif type(other) == SCALE:
            self.x_scale -= other.x_scale
            self.y_scale -= other.y_scale
            self.x_offset -= other.x_offset
            self.y_offset -= other.y_offset
            return self
        else:
            return self

class Application(object):
    def __init__(self, windows = []):
        self.windows = windows
    
    def run(self):
        curses.wrapper(self.__run)
    
    def __run(self, stdscr):
        key = 0

        curses.curs_set(0)
        curses.start_color()
        curses.init_pair(WHITE_BLACK, curses.COLOR_WHITE, curses.COLOR_BLACK)
        curses.init_pair(BLACK_WHITE, curses.COLOR_BLACK, curses.COLOR_WHITE)
        curses.init_pair(CYAN_BLACK, curses.COLOR_CYAN, curses.COLOR_BLACK)
        curses.init_pair(CYAN_WHITE, curses.COLOR_CYAN, curses.COLOR_WHITE)
        curses.init_pair(YELLOW_BLACK, curses.COLOR_YELLOW, curses.COLOR_BLACK)
        curses.init_pair(YELLOW_WHITE, curses.COLOR_YELLOW, curses.COLOR_WHITE)
        curses.init_pair(RED_BLACK, curses.COLOR_RED, curses.COLOR_BLACK)
        curses.init_pair(RED_WHITE, curses.COLOR_RED, curses.COLOR_WHITE)
        curses.init_pair(GREEN_BLACK, curses.COLOR_GREEN, curses.COLOR_BLACK)
        curses.init_pair(GREEN_WHITE, curses.COLOR_GREEN, curses.COLOR_WHITE)
        
        for window in self.windows:
            window.stdscr = stdscr

        while True:
            stdscr.clear()
            response = self.windows[-1].keypress(key)
            if response == -1:
                self.windows.pop()
            if len(self.windows) == 0:
                break
            self.windows[-1].activate(self)
            self.windows[-1].render()
            key = stdscr.getch()

    def pushWindow(self, window):
        self.windows[-1].active = False
        window.stdscr = self.windows[-1].stdscr
        self.windows.append(window)

    def popWindow(self):
        self.windows[-1].active = False
        return self.windows.pop()
    
    def quit(self):
        self.windows = []