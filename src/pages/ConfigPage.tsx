import type { View } from "./types";
import DrillEditor from "../ui/DrillEditor";

interface ConfigPageProps {
  text: string;
  error: string | null;
  fileNames: string[];
  currentFile: string | null;
  view: View;
  startView: View;
  onStartViewChange: (view: View) => void;
  onSelectFile: (name: string) => void;
  onChange: (text: string) => void;
  onApply: () => void;
  onDownload: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export default function ConfigPage(props: ConfigPageProps) {
  return (
    <div className="config-page">
      <DrillEditor {...props} />
    </div>
  );
}
