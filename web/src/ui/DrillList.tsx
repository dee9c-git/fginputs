import { useEffect, useState } from "react";
import type { DrillView } from "../state/store";

export default function DrillList({ drills }: { drills: DrillView[] }) {
    const [mode, setMode] = useState<"all" | "focus">("all");
    const [selected, setSelected] = useState<string | null>(drills[0]?.name ?? null);

    useEffect(() => {
        if (drills.length > 0 && !drills.some((d) => d.name === selected)) {
            setSelected(drills[0].name);
        }
    }, [drills, selected]);

    const focused = drills.find((d) => d.name === selected) ?? null;

    return (
        <div className="drills">
            <div className="drill-controls">
                <div className="drill-modes">
                    <button
                        className={mode === "all" ? "active" : ""}
                        onClick={() => setMode("all")}
                    >
                        All
                    </button>
                    <button
                        className={mode === "focus" ? "active" : ""}
                        onClick={() => setMode("focus")}
                    >
                        Focus
                    </button>
                </div>
            </div>
            {mode === "focus" && focused ? (
                <div className="drill-focus">
                    <select
                        value={selected ?? ""}
                        onChange={(e) => setSelected(e.target.value)}
                        className="drill-name"
                    >
                        {drills.map((d) => (
                            <option key={d.name} value={d.name}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                    <div className="drill-focus-stats">
                        <span className="drill-count">{focused.count}</span>
                    </div>
                </div>
            ) :
                <div className="drill-list">
                    {
                        drills.map((drill) => (
                            <div key={drill.name} className="drill-row">
                                <span className="drill-name">{drill.name}</span>
                                <span className="drill-count">{drill.count}</span>
                            </div>
                        ))
                    }
                </div>
            }
        </div>
    );
}
