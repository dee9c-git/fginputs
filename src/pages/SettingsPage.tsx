import DrillEditor from "../ui/DrillEditor";

interface SettingsPageProps {
  text: string;
  error: string | null;
  onChange: (text: string) => void;
  onApply: () => void;
  onDownload: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export default function SettingsPage(props: SettingsPageProps) {
  return (
    <div className="settings-page">
      <DrillEditor {...props} />
    </div>
  );
}
