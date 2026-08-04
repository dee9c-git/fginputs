import type { ReactNode } from "react";
import type { DrillView } from "../state/store";

export type View = "moves" | "training" | "settings";

export default function DrillList({
    drills,
    view,
    selected,
    onSelectedChange,
    settings,
}: {
    drills: DrillView[];
    view: View;
    selected: string | null;
    onSelectedChange: (name: string) => void;
    settings: ReactNode;
}) {
    const focused = drills.find((d) => d.name === selected) ?? null;

    return (
        <>
            {view === "settings" ? (
                <div className="settings-page">{settings}</div>
            ) : view === "training" && focused ? (
                <div className="drill-focus">
                    <select
                        value={selected ?? ""}
                        onChange={(e) => onSelectedChange(e.target.value)}
                        className="drill-name"
                    >
                        {drills.map((d) => (
                            <option key={d.name} value={d.name}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                    <div className="drill-focus-stats">
                        <span
                            className={`drill-combo${focused.missed ? " drill-combo-miss" : ""}`}
                        >
                            {focused.missed ? "COMBO: MISS" : `COMBO: x${focused.combo}`}
                        </span>
                        <span className="drill-done">
                            Success Rate:{" "}
                            {focused.attempts === 0
                                ? "--/--"
                                : `${focused.count}/${focused.attempts}`}{" "}
                            (
                            {focused.attempts > 0
                                ? Math.round((focused.count / focused.attempts) * 100)
                                : 0}
                            %) / Time:{" "}
                            {focused.attempts === 0
                                ? "--"
                                : focused.lastMissed
                                  ? "MISS"
                                  : `${focused.lastFrames}f`}{" "}
                            [Average:{" "}
                            {focused.count > 0
                                ? Math.round(focused.totalFrames / focused.count)
                                : 0}
                            f]
                        </span>
                    </div>
                </div>
            ) : (
                <div className={`drill-list`} data-move-count={drills.length > 8 ? "large" : undefined}>
                    {drills.map((d) => (
                        <div key={d.name} className="drill-row">
                            <span className="drill-name">{d.name}</span>
                            <span className="drill-stats">
                                {d.count}/{d.attempts}[
                                {d.count > 0 ? Math.round(d.totalFrames / d.count) : 0}f]
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
