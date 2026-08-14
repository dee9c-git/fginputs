import { useEffect, useState } from "react";
import { ConfigPage, MoveListPage, TrainingPage, type View } from "./pages";
import { useDrillSource } from "./state/useDrillSource";
import { useDrillTracker } from "./state/store";
import TopBar from "./ui/TopBar";

export default function App() {
  const [view, setView] = useState<View>("config");
  const [selected, setSelected] = useState<string | null>(null);

  const {
    drills,
    buttonNames,
    text,
    fileNames,
    currentFile,
    parseError,
    error,
    onTextChange,
    onApply,
    onDownload,
    onImport,
    onReset,
    onSelectFile,
  } = useDrillSource();

  useEffect(() => {
    if (drills && drills.length > 0 && !drills.some((d) => d.name === selected)) {
      setSelected(drills[0].name);
    }
  }, [drills, selected]);

  const { connected, currentAction, displayLines, drillViews } = useDrillTracker(
    drills,
    buttonNames,
    view === "training" ? selected : null,
  );

  if (error) {
    return <div className="status">Error: {error}</div>;
  }
  if (!drills || currentFile === null) {
    return <div className="status">Loading drills...</div>;
  }

  const page =
    view === "training" ? (
      <TrainingPage
        drillViews={drillViews}
        selected={selected}
        onSelectedChange={setSelected}
        connected={connected}
        currentAction={currentAction}
        displayLines={displayLines}
        buttonNames={buttonNames}
      />
    ) : view === "config" ? (
      <ConfigPage
        text={text}
        error={parseError}
        fileNames={fileNames}
        currentFile={currentFile}
        onSelectFile={onSelectFile}
        onChange={onTextChange}
        onApply={onApply}
        onDownload={onDownload}
        onImport={onImport}
        onReset={onReset}
      />
    ) : (
      <MoveListPage drillViews={drillViews} />
    );

  return (
    <div className="app">
      <TopBar view={view} onChange={setView} />
      <div className="layout">
        <div className="drills">{page}</div>
      </div>
    </div>
  );
}
