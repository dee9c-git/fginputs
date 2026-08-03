import { useEffect, useState } from "react";

interface DebugInfo {
  id: string;
  mapping: string;
  axes: number[];
  pressed: number[];
}

export default function ControllerDebug() {
  const [info, setInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    let raf = 0;
    let lastUpdate = 0;

    const read = () => {
      const now = performance.now();
      if (now - lastUpdate > 100) {
        lastUpdate = now;
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const pad = Array.from(pads).find((p) => p !== null && p.connected);
        if (pad) {
          const next: DebugInfo = {
            id: pad.id,
            mapping: pad.mapping,
            axes: pad.axes.map((a) => Math.round(a * 100) / 100),
            pressed: pad.buttons
              .map((b, i) => ({ b, i }))
              .filter(({ b }) => b.pressed || b.value > 0.1)
              .map(({ i }) => i),
          };
          setInfo((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
        } else {
          setInfo(null);
        }
      }
      raf = requestAnimationFrame(read);
    };
    raf = requestAnimationFrame(read);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!info) {
    return <div className="controller-debug">No controller detected.</div>;
  }

  return (
    <div className="controller-debug">
      <div>
        <span className="dbg-label">id</span> {info.id}
      </div>
      <div>
        <span className="dbg-label">mapping</span>{" "}
        {info.mapping === "standard" ? "standard" : `"${info.mapping}" (non-standard)`}
      </div>
      <div>
        <span className="dbg-label">axes</span>{" "}
        {info.axes.map((v, i) => `${i}:${v}`).join("  ") || "-"}
      </div>
      <div>
        <span className="dbg-label">buttons</span> {info.pressed.join(" ") || "-"}
      </div>
    </div>
  );
}
