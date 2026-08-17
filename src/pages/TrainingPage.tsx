import type { Action } from "../fgc/types";
import type { LollipopView } from "../state/lollipop";
import type { DrillView, DisplayLine } from "../state/store";
import Dropdown from "../ui/Dropdown";
import InputHistory from "../ui/InputHistory";
import ControllerDisplay from "../ui/ControllerDisplay";
import Lollipop from "../ui/Lollipop";

interface TrainingPageProps {
    drillViews: DrillView[];
    selected: string | null;
    onSelectedChange: (name: string) => void;
    connected: boolean;
    currentAction: Action | null;
    displayLines: DisplayLine[];
    buttonNames: Record<number, string>;
    lollipop: LollipopView;
}

export default function TrainingPage({
    drillViews,
    selected,
    onSelectedChange,
    connected,
    currentAction,
    displayLines,
    buttonNames,
    lollipop,
}: TrainingPageProps) {
    const trainingDrill = drillViews.find((d) => d.name === selected) ?? null;
    return (
        <div className="training-layout">
            <InputHistory lines={displayLines} />
            <div className="controller-area">
                {connected ? (
                    currentAction && (
                        <>
                            <ControllerDisplay action={currentAction} buttonNames={buttonNames} />
                            <Lollipop lollipop={lollipop} />
                        </>
                    )
                ) : (
                    <div className="controller-message">
                        No controller detected <br />
                        Press a button buddy c:
                    </div>
                )}
            </div>
            {drillViews.length > 0 ? (
                trainingDrill && (
                    <div className="drill-training">
                        <Dropdown
                            value={selected ?? ""}
                            options={drillViews.map((d) => d.name)}
                            onChange={onSelectedChange}
                            className="drill-name"
                        />
                        <span
                            className={`drill-combo${trainingDrill.missed || trainingDrill.combo === 0 ? " drill-combo-idle" : ""}`}
                        >
                            {(trainingDrill.missed || trainingDrill.combo === 0) ? "COMBO: --" : `COMBO: x${trainingDrill.combo}`}
                        </span>
                        <span className="drill-done">
                            Success Rate:{" "}
                            {trainingDrill.attempts === 0 ? "--/--" : `${trainingDrill.count}/${trainingDrill.attempts}`} (
                            {trainingDrill.attempts > 0 ? Math.round((trainingDrill.count / trainingDrill.attempts) * 100) : 0}%) / Time:{" "}
                            {trainingDrill.attempts === 0 ? "--" : trainingDrill.lastMissed ? "--" : `${trainingDrill.firstInputFrames}+${trainingDrill.allFrames - trainingDrill.firstInputFrames}f`}{" "}
                            [Average: {trainingDrill.count > 0 ? `${Math.round(trainingDrill.totalFirstInputFrames / trainingDrill.count)}+${Math.round((trainingDrill.totalFrames - trainingDrill.totalFirstInputFrames) / trainingDrill.count)}f` : "--"}]
                        </span>
                    </div>
                )
            ) : (
                <div className="drill-training">
                    <div className="drill-name drill-name-disabled">No Moves</div>
                </div>
            )}
        </div>
    );
}
