import type { Action } from "../fgc/types";
import type { DrillView, DisplayLine } from "../state/store";
import InputHistory from "../ui/InputHistory";
import ControllerDisplay from "../ui/ControllerDisplay";

interface TrainingPageProps {
    drillViews: DrillView[];
    selected: string | null;
    onSelectedChange: (name: string) => void;
    connected: boolean;
    currentAction: Action | null;
    displayLines: DisplayLine[];
    buttonNames: Record<number, string>;
}

export default function TrainingPage({
    drillViews,
    selected,
    onSelectedChange,
    connected,
    currentAction,
    displayLines,
    buttonNames,
}: TrainingPageProps) {
    const focused = drillViews.find((d) => d.name === selected) ?? null;
    console.log(focused);

    return (
        <div className="training-layout">
            <InputHistory lines={displayLines} />
            <div className="controller-area">
                {connected ? (
                    currentAction && (
                        <ControllerDisplay action={currentAction} buttonNames={buttonNames} />
                    )
                ) : (
                    <div className="controller-message">
                        No controller detected <br />
                        Press a button buddy c:
                    </div>
                )}
            </div>
            {focused && (
                <div className="drill-focus">
                    <select
                        value={selected ?? ""}
                        onChange={(e) => onSelectedChange(e.target.value)}
                        className="drill-name"
                    >
                        {drillViews.map((d) => (
                            <option key={d.name} value={d.name}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                    <span
                        className={`drill-combo${focused.missed ? " drill-combo-miss" : ""}`}
                    >
                        {(focused.missed || focused.combo === 0) ? "COMBO: --" : `COMBO: x${focused.combo}`}
                    </span>
                    <span className="drill-done">
                        Success Rate:{" "}
                        {focused.attempts === 0 ? "--/--" : `${focused.count}/${focused.attempts}`} (
                        {focused.attempts > 0 ? Math.round((focused.count / focused.attempts) * 100) : 0}%) / Time:{" "}
                        {focused.attempts === 0 ? "--" : focused.lastMissed ? "--" : `${focused.firstInputFrames}+${focused.allFrames - focused.firstInputFrames}f `}
                        [Average: {focused.count > 0 ? `${Math.round(focused.totalFirstInputFrames / focused.count)}+${Math.round((focused.totalFrames - focused.totalFirstInputFrames) / focused.count)}f` : "--"}]
                    </span>
                </div>
            )}
        </div>
    );
}
