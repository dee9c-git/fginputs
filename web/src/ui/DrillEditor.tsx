import { useRef } from "react";

interface DrillEditorProps {
  open: boolean;
  text: string;
  error: string | null;
  onChange: (text: string) => void;
  onApply: () => void;
  onDownload: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export default function DrillEditor({
  open,
  text,
  error,
  onChange,
  onApply,
  onDownload,
  onImport,
  onReset,
}: DrillEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
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
      <div className="editor-toolbar">
        <button onClick={onApply}>Apply</button>
        <button onClick={onDownload}>Download</button>
        <button onClick={() => fileInputRef.current?.click()}>Import</button>
        <button onClick={onReset}>Reset</button>
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
    </aside>
  );
}
