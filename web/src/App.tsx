import { useEffect, useState } from "react";
import { Move, type Drill } from "./fgc/types";
import { parser } from "./fgc/parser";
import { useDrillTracker } from "./state/store";
import InputHistory from "./ui/InputHistory";
import DrillList from "./ui/DrillList";
import ControllerDisplay from "./ui/ControllerDisplay";

function loadDrills(text: string): Drill[] {
  const d = parser(text);
  const drills: Drill[] = [];
  for (const [name, var_] of Object.entries(d)) {
    if (var_ instanceof Move) {
      drills.push({
        name: name
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        move: var_,
        count: 0,
      });
    }
  }
  return drills;
}

export default function App() {
  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/main.fgc")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load main.fgc (${res.status})`);
        return res.text();
      })
      .then((text) => setDrills(loadDrills(text)))
      .catch((err) => setError(String(err)));
  }, []);

  const { connected, currentAction, displayLines, drillViews } = useDrillTracker(drills);

  if (error) {
    return <div className="status">Error: {error}</div>;
  }
  if (!drills) {
    return <div className="status">Loading drills...</div>;
  }

  return (
    <div className="app">
      <div className="layout">
        <InputHistory lines={displayLines} />
        <DrillList drills={drillViews} />
      </div>
      {connected ? (
        currentAction && (
          <div className="controller-area">
            <ControllerDisplay action={currentAction} />
          </div>
        )
      ) : (
        <div className="controller-message">
          No controller detected. Press a button on your gamepad.
        </div>
      )}
    </div>
  );
}
