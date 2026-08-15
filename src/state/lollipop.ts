import type { Action, Move, SingleMove } from "../fgc/types";

export interface LollipopView {
    active: boolean;
    count: number;
}

export interface LollipopState {
    active: boolean;
    count: number;
    prevTrigger: boolean;
    prevLastInput: boolean;
}

export function createLollipopState(): LollipopState {
    return { active: false, count: 0, prevTrigger: false, prevLastInput: false };
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
): LollipopView | null {
    const lastInput = lastInputMatch(move.sequences, frameAction);
    const lastInputFresh = lastInput && !state.prevLastInput;
    state.prevLastInput = lastInput;

    const trigger = triggerMatch(move.triggers, frameAction);
    const triggerPressed = trigger && !state.prevTrigger;
    state.prevTrigger = trigger;

    if (lastInputFresh) {
        state.count = 0;
        state.active = true;
    } else if (state.active) {
        state.count += 1;
    }

    if (triggerPressed && state.active) {
        return { active: true, count: state.count };
    }
    return null;
}
