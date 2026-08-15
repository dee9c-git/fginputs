import type { LollipopView } from "../state/lollipop";

const LABELS = ["9", "8", "7", "6", "5", "4", "3", "2", "1"];

export default function Lollipop({ lollipop }: { lollipop: LollipopView }) {
    return (
        <div className="lollipop">
            {LABELS.map((label) => (
                <div
                    key={label}
                    className={`lollipop-cell${lollipop.active && lollipop.count === Number(label) ? " lollipop-active" : ""}`}
                >
                    {label}
                </div>
            ))}
            <div
                className={`lollipop-cell lollipop-zero${lollipop.active && lollipop.count === 0 ? " lollipop-active" : ""}`}
            >
                0
            </div>
        </div>
    );
}
