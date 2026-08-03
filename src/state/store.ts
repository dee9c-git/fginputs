import { useCallback, useEffect, useRef, useState } from "react";
import type { Action, Drill } from "../fgc/types";
import { actionToStr } from "../fgc/mappings";
import { didDrill, type HistoryEntry } from "../fgc/matcher";
import { buildAction, pollGamepad } from "../input/gamepad";

export interface DisplayLine {
  text: string;
  frames: number;
}

export interface DrillView {
  name: string;
  count: number;
}

export function useDrillTracker(drills: Drill[] | null) {
  const [connected, setConnected] = useState(false);
  const [displayLines, setDisplayLines] = useState<DisplayLine[]>([]);
  const [drillViews, setDrillViews] = useState<DrillView[]>([]);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);

  const toDrillViews = useCallback(
    (d: Drill[]): DrillView[] => d.map((drill) => ({ name: drill.name, count: drill.count })),
    [],
  );

  useEffect(() => {
    if (drills && drills.length > 0) {
      setDrillViews(toDrillViews(drills));
    }
  }, [drills, toDrillViews]);

  const drillsRef = useRef(drills);
  drillsRef.current = drills;

  const stateRef = useRef({
    moveHistory: [] as HistoryEntry[],
    currentAction: null as ReturnType<typeof buildAction> | null,
    currentFrames: 0,
    lastMoveIdx: null as number | null,
    anyDrill: false,
  });

  const update = useCallback(() => {
    const snapshot = pollGamepad();
    setConnected(snapshot.connected);

    const state = stateRef.current;
    const frameAction = buildAction(snapshot);
    setCurrentAction(frameAction);

    if (state.currentAction === null) {
      state.currentAction = frameAction;
      state.currentFrames = 1;
    } else if (
      frameAction.direction[0] === state.currentAction.direction[0] &&
      frameAction.direction[1] === state.currentAction.direction[1] &&
      frameAction.buttons.size === state.currentAction.buttons.size &&
      [...frameAction.buttons].every((b) => state.currentAction!.buttons.has(b))
    ) {
      state.currentFrames = Math.min(state.currentFrames + 1, 99);
    } else {
      if (state.currentFrames > 0) {
        state.moveHistory.push({ action: state.currentAction, frames: state.currentFrames });
      }
      state.currentAction = frameAction;
      state.currentFrames = 1;
    }

    const validHistory =
      state.lastMoveIdx !== null
        ? state.moveHistory.slice(state.lastMoveIdx + 1)
        : state.moveHistory.slice();
    validHistory.push({ action: state.currentAction, frames: state.currentFrames });

    const d = drillsRef.current;
    if (d && d.length > 0 && validHistory.length > 0) {
      const succeeded = didDrill(validHistory, d);
      if (succeeded) {
        state.lastMoveIdx = state.moveHistory.length - 1;
        state.anyDrill = true;
        setDrillViews(toDrillViews(d));
      }
    }

    const lines: DisplayLine[] = state.moveHistory.slice(-19).map((h) => ({
      text: actionToStr(h.action),
      frames: h.frames,
    }));
    lines.push({ text: actionToStr(state.currentAction), frames: state.currentFrames });
    lines.reverse();
    setDisplayLines(lines);
  }, [toDrillViews]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      update();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [update]);

  return { connected, currentAction, displayLines, drillViews };
}
