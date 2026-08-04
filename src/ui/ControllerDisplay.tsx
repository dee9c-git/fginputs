import { useEffect, useRef } from "react";
import type { Action } from "../fgc/types";
import { BUTTON_NAMES, LT_ID, RT_ID } from "../fgc/mappings";

const GATE_RADIUS = 90;
const KNOB_RADIUS = 26;
const PRESSED_KNOB_RADIUS = 30;
const SIDE_RADIUS = 80;
const CORNER_RADIUS = 90;
const TRAIL_LIFETIME = 450;
const TRAIL_POOL = 64;

const OCTAGON_POINTS = (() => {
  const dirs: [number, number][] = [
    [1, 0],
    [Math.SQRT1_2, Math.SQRT1_2],
    [0, 1],
    [-Math.SQRT1_2, Math.SQRT1_2],
    [-1, 0],
    [-Math.SQRT1_2, -Math.SQRT1_2],
    [0, -1],
    [Math.SQRT1_2, -Math.SQRT1_2],
  ];
  return dirs
    .map(([x, y]) => {
      const r = x === 0 || y === 0 ? SIDE_RADIUS : CORNER_RADIUS;
      return `${(GATE_RADIUS + x * r).toFixed(1)},${(GATE_RADIUS + y * r).toFixed(1)}`;
    })
    .join(" ");
})();

interface Target {
  x: number;
  y: number;
  r: number;
  pressed: boolean;
  text: string;
}

function buttonLabels(buttons: Set<number>, buttonNames: Record<number, string>): string {
  const labels: string[] = [];
  for (const btn of [...buttons].sort((a, b) => a - b)) {
    const name = buttonNames[btn];
    if (name) labels.push(name);
    else if (btn === LT_ID) labels.push("LT");
    else if (btn === RT_ID) labels.push("RT");
    else labels.push(BUTTON_NAMES[btn] ?? String(btn));
  }
  return labels.join("+");
}

export default function ControllerDisplay({
  action,
  buttonNames,
}: {
  action: Action;
  buttonNames: Record<number, string>;
}) {
  const knobRef = useRef<HTMLDivElement>(null);
  const trailSvgRef = useRef<SVGSVGElement>(null);
  const targetRef = useRef<Target>({ x: 0, y: 0, r: KNOB_RADIUS, pressed: false, text: "" });
  const posRef = useRef({ x: 0, y: 0 });

  const [dx, dy] = action.direction;
  const pressed = action.buttons.size > 0;
  const knobR = pressed ? PRESSED_KNOB_RADIUS : KNOB_RADIUS;
  const diag = dx !== 0 && dy !== 0;
  const travel = diag ? CORNER_RADIUS * Math.SQRT1_2 : SIDE_RADIUS;
  const text = pressed ? buttonLabels(action.buttons, buttonNames) : "";

  useEffect(() => {
    targetRef.current = {
      x: dx * travel,
      y: -dy * travel,
      r: knobR,
      pressed,
      text,
    };
  });

  useEffect(() => {
    const svg = trailSvgRef.current!;
    const ns = "http://www.w3.org/2000/svg";
    const lines: SVGLineElement[] = [];
    for (let i = 0; i < TRAIL_POOL; i++) {
      const line = document.createElementNS(ns, "line");
      line.setAttribute("stroke", "#4af");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");
      line.style.display = "none";
      svg.appendChild(line);
      lines.push(line);
    }

    const points: { x: number; y: number; t: number }[] = [];
    let raf = 0;

    const step = () => {
      const target = targetRef.current;
      const pos = posRef.current;
      const prevX = pos.x;
      const prevY = pos.y;

      pos.x = target.x;
      pos.y = target.y;

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`;
      }

      const dist = Math.hypot(pos.x - prevX, pos.y - prevY);
      const now = performance.now();
      if (dist > 0.3) {
        points.push({ x: pos.x, y: pos.y, t: now });
      }
      while (points.length > 0 && now - points[0].t > TRAIL_LIFETIME) {
        points.shift();
      }

      const half = GATE_RADIUS;
      for (let i = 0; i < lines.length; i++) {
        const a = points[i];
        const b = points[i + 1];
        if (a && b) {
          const alpha = 1 - (now - b.t) / TRAIL_LIFETIME;
          lines[i].setAttribute("x1", String(half + a.x));
          lines[i].setAttribute("y1", String(half + a.y));
          lines[i].setAttribute("x2", String(half + b.x));
          lines[i].setAttribute("y2", String(half + b.y));
          lines[i].setAttribute("opacity", String(Math.max(alpha, 0)));
          lines[i].style.display = "";
        } else {
          lines[i].style.display = "none";
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="stick">
      <div
        className="stick-gate"
        style={{ width: GATE_RADIUS * 2, height: GATE_RADIUS * 2 }}
      >
        <svg
          className="stick-octagon"
          width={GATE_RADIUS * 2}
          height={GATE_RADIUS * 2}
          viewBox={`0 0 ${GATE_RADIUS * 2} ${GATE_RADIUS * 2}`}
        >
          <polygon
            points={OCTAGON_POINTS}
            fill="#111"
            stroke="#444"
            strokeWidth={2}
          />
        </svg>
        <svg
          ref={trailSvgRef}
          className="stick-trail"
          width={GATE_RADIUS * 2}
          height={GATE_RADIUS * 2}
          viewBox={`0 0 ${GATE_RADIUS * 2} ${GATE_RADIUS * 2}`}
        />
        <div
          ref={knobRef}
          className="stick-knob"
          style={{
            width: knobR * 2,
            height: knobR * 2,
            fontSize: pressed ? 24 : 0,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
