import { useRef, useState } from "react";
import type { View } from "../pages/types";
import Dropdown from "./Dropdown";

interface DrillEditorProps {
    text: string;
    error: string | null;
    fileNames: string[];
    currentFile: string | null;
    startView: View;
    onStartViewChange: (view: View) => void;
    onSelectFile: (name: string) => void;
    onChange: (text: string) => void;
    onApply: () => void;
    onDownload: () => void;
    onImport: (file: File) => void;
    onReset: () => void;
}

export default function DrillEditor({
    text,
    error,
    fileNames,
    currentFile,
    startView,
    onStartViewChange,
    onSelectFile,
    onChange,
    onApply,
    onDownload,
    onImport,
    onReset,
}: DrillEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showTutorial, setShowTutorial] = useState(
        () => localStorage.getItem("fginputs.showTutorial") !== "false",
    );

    const updateShowTutorial = (value: boolean) => {
        setShowTutorial(value);
        localStorage.setItem("fginputs.showTutorial", String(value));
    };

    return (
        <div className="editor">
            <div className="editor-main">
                <textarea
                    className="editor-textarea"
                    wrap="off"
                    spellCheck={false}
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Tab") {
                            e.preventDefault();
                            const el = e.currentTarget;
                            const { selectionStart, selectionEnd } = el;
                            const next = text.slice(0, selectionStart) + "  " + text.slice(selectionEnd);
                            onChange(next);
                            requestAnimationFrame(() => {
                                el.selectionStart = el.selectionEnd = selectionStart + 2;
                            });
                        }
                    }}
                />
                {error && <div className="editor-error">{error}</div>}
            </div>
            <div className="editor-toolbar">
                {showTutorial && (
                    <div className="tutorial">
                        Hello! You can remove the tutorial using the setting below.
                        <br />
                        1. Change the text at the left side so your inputs match.
                        <br />
                        2. Click "Apply".
                        <br />
                        3. Go to Training and start practicing!
                    </div>
                )}
                <div className="fgc-file">
                    <span className="fgc-file-label">FGC File:</span>
                    <Dropdown
                        value={currentFile ?? ""}
                        options={fileNames}
                        onChange={onSelectFile}
                        className="file-selector"
                    />
                </div>
                <div className="buttons">
                    <button onClick={onApply}>Apply</button>
                    <button onClick={onReset}>Reset</button>
                    <button onClick={onDownload}>Download</button>
                    <button onClick={() => fileInputRef.current?.click()}>Import</button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".fgc,.txt"
                        hidden
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onImport(file);
                            e.target.value = "";
                        }}
                    />
                </div>
                <div className="settings">
                    <div className="setting-row">
                        <span className="settings-label">Show Tutorial:</span>
                        <div className="radio-inputs settings-toggle">
                            <label className="radio">
                                <input
                                    type="radio"
                                    name="tutorial"
                                    checked={showTutorial}
                                    onChange={() => updateShowTutorial(true)}
                                />
                                <span className="radio-item">On</span>
                            </label>
                            <label className="radio">
                                <input
                                    type="radio"
                                    name="tutorial"
                                    checked={!showTutorial}
                                    onChange={() => updateShowTutorial(false)}
                                />
                                <span className="radio-item">Off</span>
                            </label>
                        </div>
                    </div>
                    <div className="setting-row">
                        <span className="settings-label">Starting Location:</span>
                        <div className="radio-inputs settings-toggle">
                            <label className="radio">
                                <input
                                    type="radio"
                                    name="start-view"
                                    checked={startView === "config"}
                                    onChange={() => onStartViewChange("config")}
                                />
                                <span className="radio-item">Config</span>
                            </label>
                            <label className="radio">
                                <input
                                    type="radio"
                                    name="start-view"
                                    checked={startView === "training"}
                                    onChange={() => onStartViewChange("training")}
                                />
                                <span className="radio-item">Training</span>
                            </label>
                            <label className="radio">
                                <input
                                    type="radio"
                                    name="start-view"
                                    checked={startView === "moves"}
                                    onChange={() => onStartViewChange("moves")}
                                />
                                <span className="radio-item">Move List</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
