from typing import Any
BUTTONS = {
    "A": 0,
    "B": 1,
    "X": 2,
    "Y": 3,
    "L1": 4,
    "L2": 5,
    "L3": 6,
    "R1": 7,
    "R2": 8,
    "R3": 9,
    "SELECT": 10,
    "START": 11,
}
class Action:
    def __init__(self, direction: list[int] | None = None, buttons: set[int] | None = None):
        self.direction = direction if direction is not None else [0, 0]
        self.buttons = buttons if buttons is not None else set()
    def __repr__(self) -> str:
        return f"Action(direction='{self.direction}', buttons='{self.buttons}')"
    def __eq__(self, other):
        if not isinstance(other, Action):
            return NotImplemented
        return (self.direction == other.direction) and (self.buttons == other.buttons)

class SingleMove:
    def __init__(self, action: Action, min_frames: int = 1, max_frames: int = 60):
        self.action = action
        self.min_frames = min_frames
        self.max_frames = max_frames
    def __repr__(self) -> str:
        return f"SingleMove(action='{self.action}', min_frames='{self.min_frames}', max_frames='{self.max_frames}')"

class Move:
    def __init__(self, sequence, trigger: Action, buffer: int):
        self.sequence = sequence
        self.trigger = trigger
        self.buffer = buffer
    def __repr__(self) -> str:
        return f"Move(sequence='{self.sequence}', trigger='{self.trigger}', buffer='{self.buffer}')"

def parse_add_actions(action_str: str, d: dict) -> Action:
    "Parses a string of actions connected with '+' into an Action"
    actions = action_str.split("+")
    action_list = []
    for action in actions:
        if action not in d:
            raise Exception(f"Action '{action}' not found")
        action_list.append(d[action])
    direction = [0, 0]
    buttons = set()
    for action in action_list:
        direction[0] += action.direction[0]
        direction[1] += action.direction[1]
        buttons = buttons.union(action.buttons)
    return Action(direction, buttons)

def parse_time(frames: str) -> tuple[int, int]:
    """Parses a time string into a list [min_frames, max_frames]"""
    if frames[0] != "[" or frames[-1] != "]":
        raise Exception("Frames must be in the form of [min, max]")
    frames = frames[1:-1]
    min_frames, max_frames = frames.split(",")
    min_frames = min_frames.strip().lstrip()
    max_frames = max_frames.strip().lstrip()
    if min_frames[0] != "%" or max_frames[0] != "%":
        raise Exception("Frames must be in the form of [%min, %max]")
    if int(max_frames[1:]) > 60:
        raise Exception("Max frames must be less than or equal to 60")
    return (int(min_frames[1:]), int(max_frames[1:]))
def parse_sequence(sequence: str, d: dict) -> list[SingleMove]:
    the_list = sequence.split(" ")
    ret_list: list[SingleMove] = []
    for thing in the_list:
        if thing in d:
            val = d[thing]
        elif "+" in thing:
            val = parse_add_actions(thing, d)
        elif "[" in thing:
            val = parse_time(thing)
        else:
            raise Exception(f"Unknown type {type(thing)}")
        if isinstance(val, Action):
            ret_list.append(SingleMove(val))
        elif isinstance(val, tuple):
            ret_list[-1].min_frames = val[0]
            ret_list[-1].max_frames = val[1]
        else:
            raise Exception(f"{type(val)} should be an Action or tuple(frames)")

    return ret_list

def parse_right(the_type: str, right: str, d: dict):
    THE_TYPES = set(["int", "input", "time", "move", "null"])
    if the_type not in THE_TYPES:
        raise Exception(f"Type '{the_type}' not found")
    if the_type == "null":
        if type(right) != str or right != "null":
            raise Exception("null must be null")
        return "null"
    if the_type == "int":
        if type(right) != str or right[0] != "%":
            raise Exception("Integers must be in the form of %number")
        return int(right[1:])
    if the_type == "input":
        return parse_add_actions(right, d)
    if the_type == "time":
        if type(right) != str:
            raise Exception("Time must be in the form of [%min, %max]")
        return parse_time(right)
    move = Move([], None, 30)
    sequence, trigger, buffer = right.split("|")
    move.sequence = parse_sequence(sequence.strip(), d)
    move.trigger = parse_add_actions(trigger.strip(), d)
    buffer = buffer.strip()
    if buffer[0] == "%":
        move.buffer = int(buffer[1:])
    else:
        raise Exception("Buffer must be in the form of %number")
    return move

def parser(path: str = "main.fgc") -> dict[str, Any]:
    with open(path, "r") as f:
        lines = f.readlines()
        d: dict[str, Any] = {
                "gamepad.dir.up": Action([0, 1], set()),
                "gamepad.dir.down": Action([0, -1], set()),
                "gamepad.dir.left": Action([-1, 0], set()),
                "gamepad.dir.right": Action([1, 0], set()),
        }
        for btn in BUTTONS:
            d[f"gamepad.btn.{btn.lower()}"] = Action([0, 0], set([BUTTONS[btn]]))

        for line in lines:
            assign_type = None
            assign_var = None
            if "//" in line:
                line = line[:line.index("//")]
            l = line.strip()
            if "=" in l:
                left, right = l.split("=")
                left_list = left.strip().split(" ")
                if len(left_list) != 2:
                    raise Exception("Assignment must be in the form of 'type var_name'")
                assign_type, assign_var = left_list
                d[assign_var] = parse_right(assign_type, right.strip(), d)
    return d
# -------------------------
# parser()
