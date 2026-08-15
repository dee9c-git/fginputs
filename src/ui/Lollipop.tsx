import { useState } from "react";
import type { LollipopView } from "../state/lollipop";

const LABELS = ["9", "8", "7", "6", "5", "4", "3", "2", "1"];

export default function Lollipop({ lollipop }: { lollipop: LollipopView }) {
    const [toggled, setToggled] = useState<Set<string>>(new Set());

    const toggleCell = (label: string) => {
        setToggled((prev) => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });
    };

    const cellClass = (label: string, active: boolean, zero = false) =>
        `lollipop-cell${zero ? " lollipop-zero" : ""}${active ? " lollipop-active" : ""}${toggled.has(label) ? " lollipop-toggled" : ""}`;

    return (
        <div className="lollipop">
            {LABELS.map((label) => (
                <button
                    key={label}
                    type="button"
                    className={cellClass(label, lollipop.active && lollipop.count === Number(label))}
                    onClick={() => toggleCell(label)}
                >
                    {label}
                </button>
            ))}
            <button
                type="button"
                className={cellClass("0", lollipop.active && lollipop.count === 0, true)}
                onClick={() => toggleCell("0")}
            >
                0
            </button>
        </div>
    );
}
