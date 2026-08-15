import { Action, type Drill, type SingleMove } from "./types";

export interface HistoryEntry {
    action: Action;
    frames: number;
}

export interface DrillAttempt {
    inAttempt: boolean;
    succeeded: boolean;
}

export interface DrillResult {
    success: boolean;
    miss: boolean;
}

export interface SequenceMatch {
    matched: boolean;
    firstInputFrames: number;
    allFrames: number;
}

export function didDrill(
    moveHistory: HistoryEntry[],
    drills: Drill[],
    attempts: Map<Drill, DrillAttempt>,
    trainingName?: string | null,
): DrillResult {
    if (!trainingName) return { success: false, miss: false };
    const drill = drills.find((d) => d.name === trainingName);
    if (!drill) return { success: false, miss: false };
    return evaluateDrill(drill, moveHistory, attempts);
}

function evaluateDrill(
    drill: Drill,
    moveHistory: HistoryEntry[],
    attempts: Map<Drill, DrillAttempt>,
): DrillResult {
    let success = false;
    let miss = false;
    const lastEntry = moveHistory[moveHistory.length - 1];
    const secondLastEntry = moveHistory[moveHistory.length - 2];
    const triggered = drill.move.triggers.some((t) => isTriggered(t, lastEntry, secondLastEntry));
    const state = attempts.get(drill) ?? { inAttempt: false, succeeded: false };

    if (triggered) {
        if (!state.inAttempt) {
            state.inAttempt = true;
            state.succeeded = false;
            drill.missed = false;
        }
        if (!state.succeeded) {
            const okHistory = historyWithinBuffer(moveHistory, drill.move.buffer);
            const match = matchAnySequence(drill, okHistory);
            if (match.matched) {
                state.succeeded = true;
                drill.count += 1;
                drill.attempts += 1;
                drill.firstInputFrames = match.firstInputFrames;
                drill.allFrames = match.allFrames;
                drill.totalFirstInputFrames += match.firstInputFrames;
                drill.totalFrames += match.allFrames;
                drill.lastMissed = false;
                drill.combo += 1;
                drill.missed = false;
                success = true;
            }
        }
    } else if (state.inAttempt) {
        if (!state.succeeded) {
            drill.combo = 0;
            drill.attempts += 1;
            drill.lastMissed = true;
            drill.missed = true;
            miss = true;
        }
        state.inAttempt = false;
        state.succeeded = false;
    }
    attempts.set(drill, state);
    return { success, miss };
}

// Checks if the entry is a trigger that was just pressed
function isTriggered(trigger: Action, lastEntry: HistoryEntry, secondLastEntry: HistoryEntry): boolean {
    if (lastEntry.frames != 1) return false;
    return isSubset(trigger.buttons, lastEntry.action.buttons) && !isSubset(trigger.buttons, secondLastEntry.action.buttons);
}

function isSubset(sub: Set<number>, superSet: Set<number>): boolean {
    for (const btn of sub) {
        if (!superSet.has(btn)) return false;
    }
    return true;
}

function historyWithinBuffer(moveHistory: HistoryEntry[], buffer: number): HistoryEntry[] {
    const copyHistory = [...moveHistory];
    const okHistory: HistoryEntry[] = [];
    let bufferLeft = buffer;
    while (bufferLeft > 0 && copyHistory.length > 0) {
        const theMove = copyHistory.pop()!;
        okHistory.unshift(theMove);
        bufferLeft -= theMove.frames;
    }
    return okHistory;
}

function matchSequence(sequence: SingleMove[], entry: HistoryEntry[]): SequenceMatch {
    let seqIdx = sequence.length - 1;
    let i = entry.length - 1;
    let firstIdx = -1;
    while (seqIdx >= 0) {
        /*
        while (i >= 0 && !matches(sequence[seqIdx], entry[i])) {
            i -= 1;
        }
        */
        while (i >= 0) {
            if (!buttonsMatch(sequence[seqIdx], entry[i])) {
                i -= 1;
            } else {
                let currentFrames = (i == entry.length - 1) ? 0 : entry[i].frames;
                i -= 1;
                while (i >= 0 && buttonsMatch(sequence[seqIdx], entry[i])) {
                    currentFrames += entry[i].frames;
                    i -= 1;
                }
                if (framesMatch(sequence[seqIdx], currentFrames)) {
                    seqIdx -= 1;
                    break;
                }
            }
        }
        if (i < 0 && seqIdx >= 0)
            return { matched: false, firstInputFrames: -1, allFrames: -1 };
    }
    firstIdx = i + 1;
    let frames = 0;
    for (let j = firstIdx; j <= entry.length - 1; j++) {
        frames += entry[j].frames;
    }
    return { matched: true, firstInputFrames: entry[firstIdx].frames, allFrames: frames };
}

function matchAnySequence(drill: Drill, okHistory: HistoryEntry[]): SequenceMatch {
    for (const sequence of drill.move.sequences) {
        const match = matchSequence(sequence, okHistory);
        if (match.matched) return match;
    }
    return { matched: false, firstInputFrames: -1, allFrames: -1 };
}

function buttonsMatch(expected: SingleMove, real: HistoryEntry): boolean {
    return (
        expected.action.direction[0] === real.action.direction[0] &&
        expected.action.direction[1] === real.action.direction[1] &&
        isSubset(expected.action.buttons, real.action.buttons)
    );
}


function framesMatch(expected: SingleMove, frames: number): boolean {
    return expected.frames.min <= frames && expected.frames.max >= frames
}
