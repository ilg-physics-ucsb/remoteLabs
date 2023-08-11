# color constants (fg-bg)
WHITE_BLACK     = 1
BLACK_WHITE     = 2
CYAN_BLACK      = 3
CYAN_WHITE      = 4
YELLOW_BLACK    = 5
YELLOW_WHITE    = 6
RED_BLACK       = 7
RED_WHITE       = 8
GREEN_BLACK     = 9
GREEN_WHITE     = 10

# widget type constants
CUSTUM      = 0
LABEL       = 1
BAR         = 2
BUTTON      = 3
PROGBAR     = 4
#LIST        = 5
#SCROLLIST   = 6

# widget position constants
TOP_LEFT    = 0 #(0, 0)
TOP_RIGHT   = 1 #(0, window.stdscr.getmaxyx()[1] - 1)
BOT_LEFT    = 2 #(window.stdscr.getmaxyx()[0] - 1, 0)
BOT_RIGHT   = 3 #(window.stdscr.getmaxyx()[0] - 1, window.stdscr.getmaxyx()[1] - 1)