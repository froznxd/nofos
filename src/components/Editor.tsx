import { useEffect, useRef } from "react";
import type { SaveStatus } from "../hooks/useAutosave";

interface EditorProps {
  noteName: string | null;
  content: string;
  onChange: (value: string) => void;
  saveStatus: SaveStatus;
  focusKey: number;
}

function statusLabel(status: SaveStatus): string {
  switch (status) {
    case "pending":
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Error saving";
    default:
      return "";
  }
}

export function Editor({
  noteName,
  content,
  onChange,
  saveStatus,
  focusKey,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusKey > 0) {
      textareaRef.current?.focus();
    }
  }, [focusKey, noteName]);

  if (!noteName) {
    return (
      <main className="editor editor-empty">
        <p>Select a note or create a new one.</p>
      </main>
    );
  }

  const title = noteName.replace(/\.md$/i, "");

  return (
    <main className="editor">
      <header className="editor-header">
        <h1 className="editor-title">{title}</h1>
        <span className="save-status">{statusLabel(saveStatus)}</span>
      </header>
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck
      />
    </main>
  );
}
