import type { DrillView } from "../state/store";

export default function DrillList({ drills }: { drills: DrillView[] }) {
  return (
    <div className="drills">
      {drills.map((drill) => (
        <div key={drill.name} className="drill-row">
          <span className="drill-name">{drill.name}</span>
          <span className="drill-count">{drill.count}</span>
        </div>
      ))}
    </div>
  );
}
