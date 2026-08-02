import { useCallback, useEffect, useState } from "react";
import { Move, type Drill } from "./fgc/types";
import { parser, ParseError } from "./fgc/parser";
import { useDrillTracker } from "./state/store";
import InputHistory from "./ui/InputHistory";
import DrillList from "./ui/DrillList";
import DrillEditor from "./ui/DrillEditor";
import ControllerDisplay from "./ui/ControllerDisplay";

const LS_KEY = "fgc.source";

function loadDrills(text: string): Drill[] {
  const d = parser(text);
  const drills: Drill[] = [];
  for (const [name, var_] of Object.entries(d)) {
    if (var_ instanceof Move) {
      drills.push({
        name: name
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        move: var_,
        count: 0,
      });
    }
  }
  return drills;
}

function formatError(err: unknown): string {
  if (err instanceof ParseError) return `Line ${err.line}: ${err.message}`;
  return String(err);
}

export default function App() {
  const [drills, setDrills] = useState<Drill[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [defaultText, setDefaultText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/main.fgc")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load main.fgc (${res.status})`);
        return res.text();
      })
      .then((text) => {
        setDefaultText(text);
        const saved = localStorage.getItem(LS_KEY);
        const initial = saved ?? text;
        setSourceText(initial);
        try {
          setDrills(loadDrills(initial));
          setParseError(null);
        } catch (err) {
          setParseError(formatError(err));
          setDrills(loadDrills(text));
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
      setDrills(loadDrills(sourceText));
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
    a.download = "main.fgc";
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
    setDrills(loadDrills(defaultText));
    setParseError(null);
  }, [defaultText]);

  const { connected, currentAction, displayLines, drillViews } = useDrillTracker(drills);

  if (error) {
    return <div className="status">Error: {error}</div>;
  }
  if (!drills || sourceText === null) {
    return <div className="status">Loading drills...</div>;
  }

  return (
    <div className="app">
      <div className="layout">
        <InputHistory lines={displayLines} />
        <div className="drills">
          <DrillList
            drills={drillViews}
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
        </div>
      </div>
      {connected ? (
        currentAction && (
          <div className="controller-area">
            <ControllerDisplay action={currentAction} />
          </div>
        )
      ) : (
        <div className="controller-message">
          No controller detected. Press a button on your gamepad.
        </div>
      )}
    </div>
  );
}
