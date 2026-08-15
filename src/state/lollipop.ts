import type { Action, Move, SingleMove } from "../fgc/types";

export interface LollipopView {
    active: boolean;
    count: number;
}

export interface LollipopState {
    mode: "idle" | "counting" | "locked";
    count: number;
    prevTrigger: boolean;
}

export function createLollipopState(): LollipopState {
    return { mode: "idle", count: 0, prevTrigger: false };
}

function lastInputMatch(sequences: SingleMove[][], action: Action): boolean {
    return sequences.some((seq) => {
        const last = seq[seq.length - 1];
        return (
            last.action.direction[0] === action.direction[0] &&
            last.action.direction[1] === action.direction[1] &&
            [...last.action.buttons].every((b) => action.buttons.has(b))
        );
    });
}

function triggerMatch(triggers: Action[], action: Action): boolean {
    return triggers.some((t) => [...t.buttons].every((b) => action.buttons.has(b)));
}

export function updateLollipop(
    state: LollipopState,
    move: Move,
    frameAction: Action,
    firstFrame: boolean,
): void {
    const lastInput = lastInputMatch(move.sequences, frameAction);
    const lastInputPressed = lastInput && firstFrame;
    const trigger = triggerMatch(move.triggers, frameAction);
    const triggerPressed = trigger && !state.prevTrigger;
    state.prevTrigger = trigger;

    switch (state.mode) {
        case "idle":
            if (lastInputPressed) {
                if (triggerPressed) {
                    state.mode = "locked";
                    state.count = 0;
                } else {
                    state.mode = "counting";
                    state.count = 0;
                }
            }
            break;
        case "counting":
            if (triggerPressed) {
                state.mode = "locked";
            } else {
                state.count += 1;
            }
            break;
        case "locked":
            if (lastInputPressed) {
                if (triggerPressed) {
                    state.mode = "locked";
                    state.count = 0;
                } else {
                    state.mode = "counting";
                    state.count = 0;
                }
            }
            break;
    }
}
