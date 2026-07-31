import { Action, type Drill } from "./types";

export interface HistoryEntry {
  action: Action;
  frames: number;
}

export function didDrill(moveHistory: HistoryEntry[], drills: Drill[]): boolean {
  let finRes = false;
  for (const drill of drills) {
    if (!isTriggerHeld(drill.move.trigger, moveHistory[moveHistory.length - 1].action)) {
      continue;
    }
    let res = true;
    const copySequence = [...drill.move.sequence];
    const copyHistory = [...moveHistory];
    const okHistory: HistoryEntry[] = [];
    let buffer = drill.move.buffer;
    while (buffer > 0 && copyHistory.length > 0) {
      const theMove = copyHistory.pop()!;
      okHistory.unshift(theMove);
      buffer -= theMove.frames;
    }

    while (copySequence.length > 0) {
      const expectedMove = copySequence.pop()!;
      let real: HistoryEntry | undefined = okHistory.pop();
      if (!real) {
        res = false;
        break;
      }
      while (
        !(
          expectedMove.action.direction[0] === real.action.direction[0] &&
          expectedMove.action.direction[1] === real.action.direction[1] &&
          isSubset(expectedMove.action.buttons, real.action.buttons)
        ) ||
        expectedMove.maxFrames < real.frames ||
        expectedMove.minFrames > real.frames
      ) {
        real = okHistory.pop();
        if (!real) {
          res = false;
          break;
        }
      }
      if (!res) break;
    }
    if (res) {
      finRes = true;
      drill.count += 1;
    }
  }
  return finRes;
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
