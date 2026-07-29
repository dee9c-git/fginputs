import pygame
import sys
from fgc_types import *

class Drill:
    def __init__(self, name: str, move: Move, count: int = 0):
        self.name = " ".join(name.split("_")).capitalize()
        self.move = move
        self.count = count
d = parser()
moves = {}
for name, var in d.items():
    if isinstance(var, Move):
        moves[name] = Drill(name, var)
        print(f"{name} : {var}")


pygame.init()

WIDTH, HEIGHT = 1800, 1200
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Gamepad Input Viewer")

available_fonts = pygame.font.get_fonts()

font = pygame.font.SysFont("jetbrainsmono", 32)

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

BUTTON_NAMES = {
    0: "A",
    1: "RC",
    2: "P",
    3: "S",
    4: "K",
    5: "H",
    6: "Back",
    7: "Guide",
    8: "Start",
    9: "LS",
    10: "RS",
}

TRIGGER_THRESHOLD = 0.5

TRIGGER_NAMES = {
    2: "LT",
    3: "RT",
    4: "LT",
    5: "RT",
    6: "LT",
    7: "RT",
}

HAT_NAMES = {
    (0, 1): "8",
    (0, -1): "2",
    (-1, 0): "4",
    (1, 0): "6",
    (-1, 1): "7",
    (1, 1): "9",
    (-1, -1): "1",
    (1, -1): "3",
}



def main():
    clock = pygame.time.Clock()

    pygame.joystick.init()
    joystick_count = pygame.joystick.get_count()

    if joystick_count == 0:
        print("No gamepad detected. Please connect a controller and restart.")
    else:
        joy = pygame.joystick.Joystick(0)
        print(f"Controller: {joy.get_name()}")
        print(
            f"Axes: {joy.get_numaxes()}, Buttons: {joy.get_numbuttons()}, Hats: {joy.get_numhats()}"
        )

    active_buttons = set()
    active_hats = set()
    active_triggers = set()
    prev_trigger_vals = {}

    current_move = "5"
    current_frames = 0
    move_history = []

    def get_current():
        all_active = active_buttons | active_hats | active_triggers
        if not all_active:
            return "5"
        return "+".join(sorted(all_active))

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False
            elif event.type == pygame.JOYBUTTONDOWN:
                active_buttons.add(BUTTON_NAMES.get(event.button, str(event.button)))
            elif event.type == pygame.JOYBUTTONUP:
                active_buttons.discard(
                    BUTTON_NAMES.get(event.button, str(event.button))
                )
            elif event.type == pygame.JOYHATMOTION:
                if event.value == (0, 0):
                    active_hats.clear()
                else:
                    hat_name = HAT_NAMES.get(event.value)
                    if hat_name:
                        active_hats = {hat_name}
            elif event.type == pygame.JOYAXISMOTION:
                if event.axis in TRIGGER_NAMES:
                    prev_val = prev_trigger_vals.get(event.axis, 0.0)
                    trig_name = TRIGGER_NAMES[event.axis]
                    if (
                        prev_val <= TRIGGER_THRESHOLD
                        and event.value > TRIGGER_THRESHOLD
                    ):
                        active_triggers.add(trig_name)
                    elif (
                        prev_val > TRIGGER_THRESHOLD
                        and event.value <= TRIGGER_THRESHOLD
                    ):
                        active_triggers.discard(trig_name)
                    prev_trigger_vals[event.axis] = event.value

        frame_move = get_current()
        if frame_move == current_move:
            current_frames = min(current_frames + 1, 99)
        else:
            if current_frames > 0:
                move_history.append((current_move, current_frames))
            current_move = frame_move
            current_frames = 1

        display_lines = move_history[-19:]
        display_lines.append((current_move, current_frames))
        display_lines.reverse()

        screen.fill(BLACK)
        for i, (move, frames) in enumerate(display_lines):
            line = f"[{frames:2d}] {move}"
            txt = font.render(line, True, WHITE)
            y = 20 + i * 50
            screen.blit(txt, (20, y))
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
