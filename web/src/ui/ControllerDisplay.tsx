import type { Action } from "../fgc/types";
import { BUTTON_NAMES, LT_ID, RT_ID } from "../fgc/mappings";

const GATE_RADIUS = 90;
const KNOB_RADIUS = 26;
const PRESSED_KNOB_RADIUS = 30;
const MAX_OFFSET = 80;

function buttonLabels(buttons: Set<number>): string {
  const labels: string[] = [];
  for (const btn of [...buttons].sort((a, b) => a - b)) {
    if (btn === LT_ID) labels.push("LT");
    else if (btn === RT_ID) labels.push("RT");
    else labels.push(BUTTON_NAMES[btn] ?? String(btn));
  }
  return labels.join("+");
}

export default function ControllerDisplay({ action }: { action: Action }) {
  const [dx, dy] = action.direction;
  const pressed = action.buttons.size > 0;
  const knobR = pressed ? PRESSED_KNOB_RADIUS : KNOB_RADIUS;
  const diag = dx !== 0 && dy !== 0;
  const scale = diag ? 1 / Math.SQRT2 : 1;
  const offsetX = dx * MAX_OFFSET * scale;
  const offsetY = -dy * MAX_OFFSET * scale;
  const text = pressed ? buttonLabels(action.buttons) : "";

  return (
    <div className="stick">
      <div
        className="stick-gate"
        style={{ width: GATE_RADIUS * 2, height: GATE_RADIUS * 2 }}
      >
        <div
          className="stick-knob"
          style={{
            width: knobR * 2,
            height: knobR * 2,
            transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
            fontSize: pressed ? 28 : 0,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
