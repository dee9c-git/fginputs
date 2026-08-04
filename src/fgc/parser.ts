import { Action, Frames, Move, SingleMove } from "./types";

export class ParseError extends Error {
    line: number;

    constructor(message: string, line: number) {
        super(message);
        this.name = "ParseError";
        this.line = line;
    }
}

export interface ParseResult {
    defs: Record<string, unknown>;
    buttonNames: Record<number, string>;
}

export const BUTTONS: Record<string, number> = {
    b0: 0,
    b1: 1,
    b2: 2,
    b3: 3,
    b4: 4,
    b5: 5,
    b6: 6,
    b7: 7,
    b8: 8,
    b9: 9,
    b10: 10,
    b11: 11,
    l1: 4,
    lb: 4,
    l: 4,
    r1: 5,
    rb: 5,
    r: 5,
    l2: 6,
    lt: 6,
    zl: 6,
    r2: 7,
    rt: 7,
    zr: 7,
    select: 8,
    back: 8,
    share: 8,
    minus: 8,
    start: 9,
    options: 9,
    plus: 9,
    l3: 10,
    ls: 10,
    r3: 11,
    rs: 11,
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

export function parseFrames(frames: string): Frames {
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
    return new Frames(parseInt(minFrames.slice(1), 10), maxVal);
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
            val = parseFrames(thing);
        } else {
            throw new Error(`Unknown type '${thing}'`);
        }
        if (val instanceof Action) {
            retList.push(new SingleMove(val));
        } else if (val === null) {
            continue
        } else if (val instanceof Frames) {
            const last = retList[retList.length - 1];
            if (!last) throw new Error("Cannot set frames before any action");
            last.frames = val;
        } else {
            throw new Error("Expected null, Action or frames");
        }
    }
    return retList;
}

export function parseRight(theType: string, right: string, d: Record<string, unknown>): unknown {
    const THE_TYPES = new Set(["int", "input", "frames", "move", "null"]);
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
    if (theType === "frames") {
        return parseFrames(right);
    }
    const [sequenceSlot, triggerSlot, bufferStr] = right.split("|");
    if (!triggerSlot) throw new Error("Move must be in the form of 'sequence | trigger | %buffer'");
    const sequences = sequenceSlot.split(";").map((s) => {
        if (!s.trim()) throw new Error("Empty sequence alternative");
        return parseSequence(s.trim(), d);
    });
    const triggers = triggerSlot.split(";").map((s) => {
        if (!s.trim()) throw new Error("Empty trigger alternative");
        return parseAddActions(s.trim(), d);
    });
    const buffer = bufferStr.trim();
    if (!buffer.startsWith("%")) {
        throw new Error("Buffer must be in the form of %number");
    }
    return new Move(sequences, triggers, parseInt(buffer.slice(1), 10));
}

export function parser(fgcText: string): ParseResult {
    const d: Record<string, unknown> = {
        "gamepad.dir.up": new Action([0, 1], new Set()),
        "gamepad.dir.down": new Action([0, -1], new Set()),
        "gamepad.dir.left": new Action([-1, 0], new Set()),
        "gamepad.dir.right": new Action([1, 0], new Set()),
    };
    for (const btn of Object.keys(BUTTONS)) {
        d[`gamepad.btn.${btn.toLowerCase()}`] = new Action([0, 0], new Set([BUTTONS[btn]]));
    }

    const buttonNames: Record<number, string> = {};

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
            if (assignType === "input") {
                const val = d[assignVar];
                if (val instanceof Action && val.buttons.size === 1) {
                    const btn = [...val.buttons][0];
                    buttonNames[btn] = assignVar;
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new ParseError(msg, i + 1);
        }
    }
    return { defs: d, buttonNames };
}
