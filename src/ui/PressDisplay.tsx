import { useEffect, useState } from "react";
import { LT_ID, RT_ID } from "../fgc/mappings";
import { buildAction, pollGamepad } from "../input/gamepad";

function rawBtnName(btn: number): string {
    if (btn === LT_ID) return "b6";
    if (btn === RT_ID) return "b7";
    return `b${btn}`;
}

export default function PressDisplay() {
    const [display, setDisplay] = useState("Press a button c:");

    useEffect(() => {
        let raf = 0;
        const loop = () => {
            const action = buildAction(pollGamepad());
            const [dx, dy] = action.direction;
            const dirs: string[] = [];
            if (dx !== 0) dirs.push(dx > 0 ? "right" : "left");
            if (dy !== 0) dirs.push(dy > 0 ? "up" : "down");
            const btns = [...action.buttons].sort((a, b) => a - b).map(rawBtnName);

            if (dirs.length + btns.length === 0) {
                setDisplay("Press a button c:");
            } else if (dirs.length + btns.length > 1) {
                setDisplay("Multiple inputs detected!");
            } else {
                setDisplay(`gamepad.${dirs.length ? `dir.${dirs[0]}` : `btn.${btns[0]}`}`);
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="pressed-display">
            <span className="pressed-label">You pressed:</span>
            <span className="pressed-value">{display}</span>
        </div>
    );
}
