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

export function didDrill(
  moveHistory: HistoryEntry[],
  drills: Drill[],
  attempts: Map<Drill, DrillAttempt>,
  focus?: string | null,
): DrillResult {
  if (!focus) return { success: false, miss: false };
  const drill = drills.find((d) => d.name === focus);
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
  const lastAction = moveHistory[moveHistory.length - 1].action;
  const triggerHeld = drill.move.triggers.some((t) => isTriggerHeld(t, lastAction));
  const state = attempts.get(drill) ?? { inAttempt: false, succeeded: false };

  if (triggerHeld) {
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
        drill.totalFrames += match.frames;
        drill.lastFrames = match.frames;
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

function isTriggerHeld(trigger: Action, real: Action): boolean {
  return isSubset(trigger.buttons, real.buttons);
}

function isSubset(sub: Set<number>, superSet: Set<number>): boolean {
  for (const btn of sub) {
    if (!superSet.has(btn)) return false;
  }
  return true;
}

export interface SequenceMatch {
  matched: boolean;
  frames: number;
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

function matchSequence(sequence: SingleMove[], okHistory: HistoryEntry[]): SequenceMatch {
  let seqIdx = sequence.length - 1;
  let i = okHistory.length - 1;
  let lastIdx = -1;
  let firstIdx = -1;
  while (seqIdx >= 0) {
    while (i >= 0 && !matches(sequence[seqIdx], okHistory[i])) {
      i -= 1;
    }
    if (i < 0) return { matched: false, frames: 0 };
    if (lastIdx === -1) lastIdx = i;
    firstIdx = i;
    seqIdx -= 1;
    i -= 1;
  }
  let frames = 0;
  for (let j = firstIdx; j <= lastIdx; j++) {
    frames += okHistory[j].frames;
  }
  return { matched: true, frames };
}

function matchAnySequence(drill: Drill, okHistory: HistoryEntry[]): SequenceMatch {
  for (const sequence of drill.move.sequences) {
    const match = matchSequence(sequence, okHistory);
    if (match.matched) return match;
  }
  return { matched: false, frames: 0 };
}

function matches(expected: SingleMove, real: HistoryEntry): boolean {
  return (
    expected.action.direction[0] === real.action.direction[0] &&
    expected.action.direction[1] === real.action.direction[1] &&
    isSubset(expected.action.buttons, real.action.buttons) &&
    expected.frames.min <= real.frames &&
    expected.frames.max >= real.frames
  );
}
