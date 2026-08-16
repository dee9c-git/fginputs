import type { View } from "../pages/types";

export default function TopBar({
    view,
    onChange,
}: {
    view: View;
    onChange: (view: View) => void;
}) {
    return (
        <div className="top-bar">
            <div className="top-bar-left">
                <span className="brand">FGINPUTS</span>
            </div>
            <div className="drill-controls">
                <div className="radio-inputs">
                    <label className="radio">
                        <input
                            type="radio"
                            name="drill-view"
                            checked={view === "config"}
                            onChange={() => onChange("config")}
                        />
                        <span className="radio-item">Config</span>
                    </label>
                    <label className="radio">
                        <input
                            type="radio"
                            name="drill-view"
                            checked={view === "training"}
                            onChange={() => onChange("training")}
                        />
                        <span className="radio-item">Training</span>
                    </label>
                    <label className="radio">
                        <input
                            type="radio"
                            name="drill-view"
                            checked={view === "moves"}
                            onChange={() => onChange("moves")}
                        />
                        <span className="radio-item">Move List</span>
                    </label>
                </div>
            </div>
            <div className="top-bar-right">
                <a
                    className="brand-github"
                    href="https://github.com/dee9c-git/fginputs"
                    target="_blank"
                    rel="noreferrer"
                >
                    <svg>
                        <use href="/icons.svg#github-icon" />
                    </svg>
                    <span className="brand-github-text">GitGud</span>
                </a>
            </div>
        </div>
    );
}
