import type { DrillView } from "../state/store";

export default function MoveListPage({ drillViews }: { drillViews: DrillView[] }) {
    return (
        <div className="drill-list" data-move-count={drillViews.length > 8 ? "large" : undefined}>
            {drillViews.map((d) => (
                <div key={d.name} className="drill-row">
                    <span className="drill-name">{d.name}</span>
                    <span className="drill-stats">
                        {d.attempts > 0 ? `${d.count}/${d.attempts}` : "--/--"} [
                        {d.count > 0 ? `${Math.round(d.totalFirstInputFrames / d.count)}+${Math.round((d.totalFrames - d.totalFirstInputFrames) / d.count)}f` : "--"}]
                    </span>
                </div>
            ))}
        </div>
    );
}
