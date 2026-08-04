import { useCallback, useEffect, useState } from "react";
import { Move, type Drill } from "./fgc/types";
import { parser, ParseError } from "./fgc/parser";
import { useDrillTracker } from "./state/store";
import InputHistory from "./ui/InputHistory";
import DrillList, { type View } from "./ui/DrillList";
import DrillEditor from "./ui/DrillEditor";
import ControllerDisplay from "./ui/ControllerDisplay";

const LS_KEY = "fgc.source";

function loadDrills(text: string): { drills: Drill[]; buttonNames: Record<number, string> } {
  const { defs, buttonNames } = parser(text);
  const drills: Drill[] = [];
  for (const [name, var_] of Object.entries(defs)) {
    if (var_ instanceof Move) {
      drills.push({
        name: name
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        move: var_,
        count: 0,
        combo: 0,
        missed: false,
        attempts: 0,
        totalFrames: 0,
        lastFrames: 0,
        lastMissed: false,
      });
    }
  }
  return { drills, buttonNames };
}

function formatError(err: unknown): string {
  if (err instanceof ParseError) return `Line ${err.line}: ${err.message}`;
  return String(err);
}

export default function App() {
  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [buttonNames, setButtonNames] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [defaultText, setDefaultText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [view, setView] = useState<View>("settings");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (drills && drills.length > 0 && !drills.some((d) => d.name === selected)) {
      setSelected(drills[0].name);
    }
  }, [drills, selected]);

  useEffect(() => {
    fetch("/fgc_files/ggst.fgc")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ggst.fgc (${res.status})`);
        return res.text();
      })
      .then((text) => {
        setDefaultText(text);
        const saved = localStorage.getItem(LS_KEY);
        const initial = saved ?? text;
        setSourceText(initial);
        try {
          const result = loadDrills(initial);
          setDrills(result.drills);
          setButtonNames(result.buttonNames);
          setParseError(null);
        } catch (err) {
          setParseError(formatError(err));
          const result = loadDrills(text);
          setDrills(result.drills);
          setButtonNames(result.buttonNames);
        }
      })
      .catch((err) => setError(String(err)));
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setSourceText(text);
    localStorage.setItem(LS_KEY, text);
  }, []);

  const handleApply = useCallback(() => {
    if (sourceText === null) return;
    try {
      const result = loadDrills(sourceText);
      setDrills(result.drills);
      setButtonNames(result.buttonNames);
      setParseError(null);
    } catch (err) {
      setParseError(formatError(err));
    }
  }, [sourceText]);

  const handleDownload = useCallback(() => {
    if (sourceText === null) return;
    const blob = new Blob([sourceText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ggst.fgc";
    a.click();
    URL.revokeObjectURL(url);
  }, [sourceText]);

  const handleImport = useCallback((file: File) => {
    file
      .text()
      .then((text) => {
        setSourceText(text);
        localStorage.setItem(LS_KEY, text);
      })
      .catch((err) => setParseError(formatError(err)));
  }, []);

  const handleReset = useCallback(() => {
    setSourceText(defaultText);
    localStorage.removeItem(LS_KEY);
    const result = loadDrills(defaultText);
    setDrills(result.drills);
    setButtonNames(result.buttonNames);
    setParseError(null);
  }, [defaultText]);

  const { connected, currentAction, displayLines, drillViews } = useDrillTracker(
    drills,
    buttonNames,
    view === "training" ? selected : null,
  );

  if (error) {
    return <div className="status">Error: {error}</div>;
  }
  if (!drills || sourceText === null) {
    return <div className="status">Loading drills...</div>;
  }

  return (
    <div className="app">
      <div className="top-bar">
        <div className="drill-controls">
          <div className="radio-inputs">
            <label className="radio">
              <input
                type="radio"
                name="drill-view"
                checked={view === "settings"}
                onChange={() => setView("settings")}
              />
              <span className="radio-item">Settings</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="drill-view"
                checked={view === "training"}
                onChange={() => setView("training")}
              />
              <span className="radio-item">Training</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="drill-view"
                checked={view === "moves"}
                onChange={() => setView("moves")}
              />
              <span className="radio-item">Move List</span>
            </label>
          </div>
        </div>
      </div>
      <div className="layout">
        <div className="drills">
          {view === "training" ? (
            <div className="training-layout">
              <InputHistory lines={displayLines} />
              <div className="training-main">
                <DrillList
                  drills={drillViews}
                  view={view}
                  selected={selected}
                  onSelectedChange={setSelected}
                  settings={
                    <DrillEditor
                      text={sourceText}
                      error={parseError}
                      onChange={handleTextChange}
                      onApply={handleApply}
                      onDownload={handleDownload}
                      onImport={handleImport}
                      onReset={handleReset}
                    />
                  }
                />
                {connected ? (
                  currentAction && (
                    <div className="controller-area">
                      <ControllerDisplay action={currentAction} buttonNames={buttonNames} />
                    </div>
                  )
                ) : (
                  <div className="controller-message">
                    No controller detected. Press a button on your gamepad.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <DrillList
              drills={drillViews}
              view={view}
              selected={selected}
              onSelectedChange={setSelected}
              settings={
                <DrillEditor
                  text={sourceText}
                  error={parseError}
                  onChange={handleTextChange}
                  onApply={handleApply}
                  onDownload={handleDownload}
                  onImport={handleImport}
                  onReset={handleReset}
                />
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
