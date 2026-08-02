import { Action, Move, SingleMove } from "./types";

export class ParseError extends Error {
    line: number;

    constructor(message: string, line: number) {
        super(message);
        this.name = "ParseError";
        this.line = line;
    }
}

export const BUTTONS: Record<string, number> = {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    L1: 4,
    L2: 5,
    L3: 6,
    R1: 7,
    R2: 8,
    R3: 9,
    SELECT: 10,
    START: 11,
};

export function parseAddActions(actionStr: string, d: Record<string, unknown>): Action {
    const actions = actionStr.split("+");
    const actionList: Action[] = [];
    for (const action of actions) {
        if (!(action in d)) {
            throw new Error(`Action '${action}' not found`);
        }
        actionList.push(d[action] as Action);
    }
    const direction: [number, number] = [0, 0];
    const buttons = new Set<number>();
    for (const action of actionList) {
        direction[0] += action.direction[0];
        direction[1] += action.direction[1];
        action.buttons.forEach((b) => buttons.add(b));
    }
    return new Action(direction, buttons);
}

export function parseTime(frames: string): [number, number] {
    if (frames[0] !== "[" || frames[frames.length - 1] !== "]") {
        throw new Error("Frames must be in the form of [min, max]");
    }
    const inner = frames.slice(1, -1);
    const [minFrames, maxFrames] = inner.split(",").map((s) => s.trim());
    if (!minFrames.startsWith("%") || !maxFrames.startsWith("%")) {
        throw new Error("Frames must be in the form of [%min, %max]");
    }
    const maxVal = parseInt(maxFrames.slice(1), 10);
    if (maxVal > 60) {
        throw new Error("Max frames must be less than or equal to 60");
    }
    return [parseInt(minFrames.slice(1), 10), maxVal];
}

export function parseSequence(sequence: string, d: Record<string, unknown>): SingleMove[] {
    const theList = sequence.split(" ");
    const retList: SingleMove[] = [];
    for (const thing of theList) {
        let val: unknown;
        if (thing in d) {
            val = d[thing];
        } else if (thing.includes("+")) {
            val = parseAddActions(thing, d);
        } else if (thing.includes("[")) {
            val = parseTime(thing);
        } else {
            throw new Error(`Unknown type '${thing}'`);
        }
        if (val instanceof Action) {
            retList.push(new SingleMove(val));
        } else if (val === null) {
            continue
        } else if (Array.isArray(val)) {
            const last = retList[retList.length - 1];
            if (!last) throw new Error("Cannot set frames before any action");
            last.minFrames = val[0];
            last.maxFrames = val[1];
        } else {
            throw new Error("Expected null, Action or frames");
        }
    }
    return retList;
}

export function parseRight(theType: string, right: string, d: Record<string, unknown>): unknown {
    const THE_TYPES = new Set(["int", "input", "time", "move", "null"]);
    if (!THE_TYPES.has(theType)) {
        throw new Error(`Type '${theType}' not found`);
    }
    if (theType === "null") {
        if (right !== "null") throw new Error("null must be null");
        return null;
    }
    if (theType === "int") {
        if (!right.startsWith("%")) throw new Error("Integers must be in the form of %number");
        return parseInt(right.slice(1), 10);
    }
    if (theType === "input") {
        return parseAddActions(right, d);
    }
    if (theType === "time") {
        return parseTime(right);
    }
    const [sequence, trigger, bufferStr] = right.split("|");
    if (!trigger) throw new Error("Move must be in the form of 'sequence | trigger | %buffer'");
    const move = new Move([], new Action(), 30);
    move.sequence = parseSequence(sequence.trim(), d);
    move.trigger = parseAddActions(trigger.trim(), d);
    const buffer = bufferStr.trim();
    if (!buffer.startsWith("%")) {
        throw new Error("Buffer must be in the form of %number");
    }
    move.buffer = parseInt(buffer.slice(1), 10);
    return move;
}

export function parser(fgcText: string): Record<string, unknown> {
    const d: Record<string, unknown> = {
        "gamepad.dir.up": new Action([0, 1], new Set()),
        "gamepad.dir.down": new Action([0, -1], new Set()),
        "gamepad.dir.left": new Action([-1, 0], new Set()),
        "gamepad.dir.right": new Action([1, 0], new Set()),
    };
    for (const btn of Object.keys(BUTTONS)) {
        d[`gamepad.btn.${btn.toLowerCase()}`] = new Action([0, 0], new Set([BUTTONS[btn]]));
    }

    const lines = fgcText.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes("//")) {
            line = line.slice(0, line.indexOf("//"));
        }
        const trimmed = line.trim();
        if (!trimmed.includes("=")) continue;
        const equalsIdx = trimmed.indexOf("=");
        const leftStr = trimmed.slice(0, equalsIdx).trim();
        const rightStr = trimmed.slice(equalsIdx + 1).trim();
        const leftList = leftStr.split(" ").filter((s) => s.length > 0);
        if (leftList.length !== 2) {
            throw new Error("Assignment must be in the form of 'type var_name'");
        }
        const [assignType, assignVar] = leftList;
        try {
            d[assignVar] = parseRight(assignType, rightStr, d);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new ParseError(msg, i + 1);
        }
    }
    return d;
}
