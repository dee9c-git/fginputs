import type { DisplayLine } from "../state/store";

export default function InputHistory({ lines }: { lines: DisplayLine[] }) {
  return (
    <div className="history">
      {lines.map((line, i) => (
        <div key={i} className="history-line">
          <span className="frames">[{String(line.frames).padStart(2, " ")}]</span>
          <span className="move">{line.text}</span>
        </div>
      ))}
    </div>
  );
}
