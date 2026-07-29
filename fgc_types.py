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
    def __init__(self, direction: list[int] = [0, 0], buttons: set[int] = set()):
        self.direction = direction
        self.buttons = buttons
    def __repr__(self) -> str:
        return f"Action(direction='{self.direction}', buttons='{self.buttons}')"

class SingleMove:
    def __init__(self, action: Action, min_frames: int = 1, max_frames: int = 60):
        self.action = action
        self.min_frames = min_frames
        self.max_frames = max_frames
    def __repr__(self) -> str:
        return f"SingleMove(action='{self.action}', min_frames='{self.min_frames}', max_frames='{self.max_frames}')"

class Move:
    def __init__(self, actions: list[SingleMove] = []):
        self.actions = actions
    def __repr__(self) -> str:
        return f"Move(actions='{self.actions}')"

def add_actions(actions: list[Action]) -> Action:
    direction = [0, 0]
    buttons = set()
    for action in actions:
        direction[0] += action.direction[0]
        direction[1] += action.direction[1]
        buttons = buttons.union(action.buttons)
    return Action(direction, buttons)

def parse_time(frames: str) -> list[int]:
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
    return [int(min_frames[1:]), int(max_frames[1:])]

def parse_right(the_type: str, right, d):
    THE_TYPES = set(["int", "input", "time", "move", "null"])
    if the_type not in THE_TYPES:
        raise Exception(f"Type '{the_type}' not found")
    if the_type == "null":
        right = right[0]
        if type(right) != str or right != "null":
            raise Exception("null must be null")
        return "null"
    if the_type == "int":
        right = right[0]
        if type(right) != str or right[0] != "%":
            raise Exception("Integers must be in the form of %number")
        return int(right[1:])
    if the_type == "input":
        right = right[0]
        actions = right.split("+")
        action_list = []
        for action in actions:
            if action not in d:
                raise Exception(f"Action '{action}' not found")
            action_list.append(d[action])
        return add_actions(action_list)
    if the_type == "time":
        right = right[0]
        if type(right) != str:
            raise Exception("Time must be in the form of [%min, %max]")
        return parse_time(right)
    move = Move()
    for thing in right:
        if thing[0] == "[":
            if move.actions:
                min_frames, max_frames = parse_time(thing)
                move.actions[-1].min_frames = min_frames
                move.actions[-1].max_frames = max_frames
            else:
                raise Exception("Lacking action to set time for move")
        else:
            if thing in d:
                val = d[thing]
            else:
                actions = thing.split("+")
                action_list = []
                for action in actions:
                    if action not in d:
                        raise Exception(f"Action '{action}' not found")
                    action_list.append(d[action])
                val = add_actions(action_list)
            if isinstance(val, Move):
                move.actions.extend(val.actions)
                continue
            elif isinstance(val, Action):
                move.actions.append(SingleMove(val))
                continue
            else:
                raise Exception(f"Unknown type {type(val)}")
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
            l = line.strip().split(" ")
            if "=" in l:
                equals_idx = l.index("=")
                left, right = l[:equals_idx], l[equals_idx+1:]
                if len(left) != 2:
                    raise Exception("Assignment must be in the form of 'type var_name'")
                assign_type, assign_var = left
                d[assign_var] = parse_right(assign_type, right, d)
    return d
# -------------------------
# parser()
