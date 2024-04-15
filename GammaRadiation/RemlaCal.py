import json, os
# from labcontrol import S42CStepperMotor as S42C

from textual.app import App, ComposeResult
from textual.containers import ScrollableContainer
from textual.reactive import reactive
from textual.screen import Screen
from textual.widgets import Button, Footer, Header, Static

GREET = """\
______               _         _____       _ 
| ___ \             | |       /  __ \     | |
| |_/ /___ _ __ ___ | | __ _  | /  \/ __ _| |
|    // _ \ '_ ` _ \| |/ _` | | |    / _` | |
| |\ \  __/ | | | | | | (_| | | \__/\ (_| | |
\_| \_\___|_| |_| |_|_|\__,_|  \____/\__,_|_|
"""

class StepperCal(App):
    # Footer bindings
    BINDINGS = [("escape", "exit", "Exit program"),
                ("d", "toggle_dark", "Toggle dark mode")]

    def compose(self) -> ComposeResult:
        yield Static(GREET)
        yield Static("By Barry Wang, 2024")
        yield Header()
        yield Footer()

    def action_toggle_dark(self) -> None:
        self.dark = not self.dark

    def action_exit(self) -> None:
        quit()

if __name__ == "__main__":
    app = StepperCal()
    app.run()
