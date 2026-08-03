import pygame
import sys
from fgc_types import *

class Drill:
    def __init__(self, name: str, move: Move, count: int = 0):
        self.name = " ".join(name.split("_")).title()
        self.move = move
        self.count = count
d = parser()
drills: list[Drill] = []
for name, var in d.items():
    if isinstance(var, Move):
        drills.append(Drill(name, var))
        print(f"{name} : {var}")


pygame.init()

WIDTH, HEIGHT = 1800, 1200
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Gamepad Input Viewer")

available_fonts = pygame.font.get_fonts()

font = pygame.font.SysFont("jetbrainsmono", 32)
big_font = pygame.font.SysFont("jetbrainsmono", 64)

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

DIR_NAMES = {
    (0, 1): "8",
    (0, -1): "2",
    (-1, 0): "4",
    (1, 0): "6",
    (-1, 1): "7",
    (1, 1): "9",
    (-1, -1): "1",
    (1, -1): "3",
}

TRIGGER_THRESHOLD = 0.5

LT_ID = 100
RT_ID = 101

TRIGGER_AXES = {
    2: LT_ID,
    4: LT_ID,
    6: LT_ID,
    3: RT_ID,
    5: RT_ID,
    7: RT_ID,
}


def action_to_str(action: Action) -> str:
    parts = []
    dx, dy = action.direction
    if dx != 0 or dy != 0:
        name = DIR_NAMES.get((dx, dy))
        if name:
            parts.append(name)
    if not parts and not action.buttons:
        return "5"
    for btn in sorted(action.buttons):
        if btn == LT_ID:
            parts.append("LT")
        elif btn == RT_ID:
            parts.append("RT")
        else:
            parts.append(BUTTON_NAMES.get(btn, str(btn)))
    return "+".join(parts)


def did_drill(move_history: list[tuple[Action, int]]):
    fin_res = False
    for drill in drills:
        # find if current input causes a trigger
        if not drill.move.trigger.buttons <= move_history[-1][0].buttons:
            continue
        res = True
        copy_sequence = drill.move.sequence.copy()
        copy_history = move_history.copy()
        ok_history = []
        buffer = drill.move.buffer
        while buffer > 0 and copy_history:
            the_move = copy_history.pop()
            ok_history.insert(0, the_move)
            buffer -= the_move[1]


        while copy_sequence:
            expected_move = copy_sequence.pop()
            if ok_history:
                real_action, real_frames = ok_history.pop()
            else:
                res = False
                break
            while (not (expected_move.action.direction == real_action.direction and expected_move.action.buttons <= real_action.buttons)
                   or expected_move.max_frames < real_frames or expected_move.min_frames > real_frames):
                if ok_history:
                    real_action, real_frames = ok_history.pop()
                else:
                    res = False
                    break
        if res:
            fin_res = True
            drill.count += 1
    return fin_res

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

    active_buttons: set[int] = set()
    current_direction: list[int] = [0, 0]
    active_triggers: set[int] = set()
    prev_trigger_vals: dict[int, float] = {}

    current_action = Action([0, 0], set())
    current_frames = 0
    move_history: list[tuple[Action, int]] = []
    last_move_idx: int | None = None

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False
            elif event.type == pygame.JOYBUTTONDOWN:
                active_buttons.add(event.button)
            elif event.type == pygame.JOYBUTTONUP:
                active_buttons.discard(event.button)
            elif event.type == pygame.JOYHATMOTION:
                if event.value == (0, 0):
                    current_direction = [0, 0]
                else:
                    current_direction = list(event.value)
            elif event.type == pygame.JOYAXISMOTION:
                if event.axis in TRIGGER_AXES:
                    btn = TRIGGER_AXES[event.axis]
                    prev_val = prev_trigger_vals.get(event.axis, 0.0)
                    if prev_val <= TRIGGER_THRESHOLD and event.value > TRIGGER_THRESHOLD:
                        active_triggers.add(btn)
                    elif prev_val > TRIGGER_THRESHOLD and event.value <= TRIGGER_THRESHOLD:
                        active_triggers.discard(btn)
                    prev_trigger_vals[event.axis] = event.value

        all_buttons = active_buttons | active_triggers
        frame_action = Action(current_direction[:], set(all_buttons))

        if frame_action.direction == current_action.direction and frame_action.buttons == current_action.buttons:
            current_frames = min(current_frames + 1, 99)
        else:
            if current_frames > 0:
                move_history.append((current_action, current_frames))
            current_action = frame_action
            current_frames = 1

        valid_history = (move_history[last_move_idx + 1:] if last_move_idx is not None else move_history[:])
        valid_history.append((current_action, current_frames))
        drill_succeeded = did_drill(valid_history)
        if drill_succeeded:
            last_move_idx = len(move_history) - 1

        display_lines = move_history[-19:]
        display_lines.append((current_action, current_frames))
        display_lines.reverse()

        screen.fill(BLACK)
        for i, (move, frames) in enumerate(display_lines):
            line = f"[{frames:2d}] {action_to_str(move)}"
            txt = font.render(line, True, WHITE)
            y = 20 + i * 50
            screen.blit(txt, (20, y))

        for i, drill in enumerate(drills):
            drill_name = big_font.render(drill.name, True, WHITE)
            screen.blit(drill_name, (500, 20 + i * 80))
            drill_count = big_font.render(f"{drill.count}", True, WHITE)
            screen.blit(drill_count, (WIDTH - 300, 20 + i * 80))
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
