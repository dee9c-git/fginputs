import { Action } from "./types";

export const BUTTON_NAMES: Record<number, string> = {
  0: "A",
  1: "RC",
  2: "P",
  3: "S",
  4: "K",
  5: "H",
  6: "Back",
  7: "Guide",
  8: "Start",
  9: "LS",
  10: "RS",
};

export const DIR_NAMES: Record<string, string> = {
  "0,1": "8",
  "0,-1": "2",
  "-1,0": "4",
  "1,0": "6",
  "-1,1": "7",
  "1,1": "9",
  "-1,-1": "1",
  "1,-1": "3",
};

export const TRIGGER_THRESHOLD = 0.5;

export const LT_ID = 100;
export const RT_ID = 101;

export const TRIGGER_AXES: Record<number, number> = {
  2: LT_ID,
  4: LT_ID,
  6: LT_ID,
  3: RT_ID,
  5: RT_ID,
  7: RT_ID,
};

export function actionToStr(action: Action): string {
  const parts: string[] = [];
  const [dx, dy] = action.direction;
  if (dx !== 0 || dy !== 0) {
    const name = DIR_NAMES[`${dx},${dy}`];
    if (name) parts.push(name);
  }
  if (parts.length === 0 && action.buttons.size === 0) {
    return "5";
  }
  for (const btn of [...action.buttons].sort((a, b) => a - b)) {
    if (btn === LT_ID) parts.push("LT");
    else if (btn === RT_ID) parts.push("RT");
    else parts.push(BUTTON_NAMES[btn] ?? String(btn));
  }
  return parts.join("+");
}
