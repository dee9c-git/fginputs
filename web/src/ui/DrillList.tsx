import { useEffect, useState, type ReactNode } from "react";
import type { DrillView } from "../state/store";

type View = "all" | "focus" | "settings";

export default function DrillList({
    drills,
    settings,
}: {
    drills: DrillView[];
    settings: ReactNode;
}) {
    const [view, setView] = useState<View>("all");
    const [selected, setSelected] = useState<string | null>(drills[0]?.name ?? null);

    useEffect(() => {
        if (drills.length > 0 && !drills.some((d) => d.name === selected)) {
            setSelected(drills[0].name);
        }
    }, [drills, selected]);

    const focused = drills.find((d) => d.name === selected) ?? null;

    return (
        <>
            <div className="drill-controls">
                <div className="radio-inputs">
                    <label className="radio">
                        <input
                            type="radio"
                            name="drill-view"
                            checked={view === "all"}
                            onChange={() => setView("all")}
                        />
                        <span className="radio-item">All</span>
                    </label>
                    <label className="radio">
                        <input
                            type="radio"
                            name="drill-view"
                            checked={view === "focus"}
                            onChange={() => setView("focus")}
                        />
                        <span className="radio-item">Focus</span>
                    </label>
                    <label className="radio">
                        <input
                            type="radio"
                            name="drill-view"
                            checked={view === "settings"}
                            onChange={() => setView("settings")}
                        />
                        <span className="radio-item">Settings</span>
                    </label>
                </div>
            </div>
            {view === "settings" ? (
                <div className="settings-page">{settings}</div>
            ) : view === "focus" && focused ? (
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
            ) : (
                <div className="drill-list">
                    {drills.map((drill) => (
                        <div key={drill.name} className="drill-row">
                            <span className="drill-name">{drill.name}</span>
                            <span className="drill-count">{drill.count}</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
