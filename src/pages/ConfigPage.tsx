import DrillEditor from "../ui/DrillEditor";

interface ConfigPageProps {
  text: string;
  error: string | null;
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
