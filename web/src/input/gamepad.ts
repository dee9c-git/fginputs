import { Action } from "../fgc/types";
import { LT_ID, RT_ID, TRIGGER_AXES, TRIGGER_THRESHOLD } from "../fgc/mappings";

const DPAD_UP = 12;
const DPAD_DOWN = 13;
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;

const ANALOG_TRIGGERS: Record<number, number> = { 6: LT_ID, 7: RT_ID };

export interface GamepadSnapshot {
  connected: boolean;
  name: string;
  buttons: Set<number>;
  direction: [number, number];
}

export function pollGamepad(): GamepadSnapshot {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find((p) => p !== null && p.connected);

  if (!pad) {
    return { connected: false, name: "", buttons: new Set(), direction: [0, 0] };
  }

  const buttons = new Set<number>();
  const direction: [number, number] = [0, 0];

  for (let i = 0; i < pad.buttons.length; i++) {
    const b = pad.buttons[i];
    if (!b) continue;

    if (i === DPAD_UP || i === DPAD_DOWN || i === DPAD_LEFT || i === DPAD_RIGHT) {
      if (b.pressed || b.value > 0.5) {
        if (i === DPAD_UP) direction[1] += 1;
        if (i === DPAD_DOWN) direction[1] -= 1;
        if (i === DPAD_LEFT) direction[0] -= 1;
        if (i === DPAD_RIGHT) direction[0] += 1;
      }
      continue;
    }

    if (i in ANALOG_TRIGGERS) {
      if (b.value > TRIGGER_THRESHOLD) {
        buttons.add(ANALOG_TRIGGERS[i]);
      }
      continue;
    }

    if (b.pressed || b.value > TRIGGER_THRESHOLD) {
      buttons.add(i);
    }
  }

  for (let i = 0; i < pad.axes.length; i++) {
    const val = pad.axes[i];
    if (i in TRIGGER_AXES) {
      if (Math.abs(val) > TRIGGER_THRESHOLD) {
        buttons.add(TRIGGER_AXES[i]);
      }
    }
  }

  return { connected: true, name: pad.id, buttons, direction };
}

export function buildAction(snapshot: GamepadSnapshot): Action {
  return new Action([snapshot.direction[0], snapshot.direction[1]], new Set(snapshot.buttons));
}
