import { useCallback, useEffect, useRef, useState } from "react";
import { writeNote } from "./lib/tauriNotes";
import { open } from "@tauri-apps/plugin-dialog";
import { Editor } from "./components/Editor";
import { Sidebar } from "./components/Sidebar";
import { VaultGate } from "./components/VaultGate";
import { useAutosave } from "./hooks/useAutosave";
import {
  createNote,
  getVaultPath,
  listNotes,
  readNote,
  setVaultPath,
  type NoteMeta,
} from "./lib/tauriNotes";

function App() {
  const [vaultPath, setVaultPathState] = useState<string | null>(null);
  const [loadingVault, setLoadingVault] = useState(true);
  const [folderBusy, setFolderBusy] = useState(false);
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editorFocusKey, setEditorFocusKey] = useState(0);

  const contentRef = useRef(content);
  contentRef.current = content;
  const activeNoteRef = useRef(activeNote);
  activeNoteRef.current = activeNote;

  const saveStatus = useAutosave(activeNote, content);

  const flushActiveNote = useCallback(async () => {
    const name = activeNoteRef.current;
    if (!name) {
      return;
    }
    await writeNote(name, contentRef.current);
  }, []);

  const refreshNotes = useCallback(async () => {
    const list = await listNotes();
    setNotes(list);
    return list;
  }, []);

  const loadNote = useCallback(
    async (name: string) => {
      const current = activeNoteRef.current;
      if (current !== null && current !== name) {
        await flushActiveNote().catch(() => undefined);
      }
      const text = await readNote(name);
      setActiveNote(name);
      setContent(text);
    },
    [flushActiveNote],
  );

  const pickFolder = useCallback(async () => {
    setFolderBusy(true);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose notes folder",
      });
      if (selected === null || Array.isArray(selected)) {
        return;
      }
      await setVaultPath(selected);
      setVaultPathState(selected);
      const list = await refreshNotes();
      if (list.length > 0) {
        await loadNote(list[0].id);
      } else {
        setActiveNote(null);
        setContent("");
      }
    } finally {
      setFolderBusy(false);
    }
  }, [loadNote, refreshNotes]);

  const handleNewNote = useCallback(async () => {
    await flushActiveNote().catch(() => undefined);
    const created = await createNote();
    const list = await refreshNotes();
    setNotes(list);
    setActiveNote(created.name);
    setContent(created.content);
    setEditorFocusKey((k) => k + 1);
  }, [flushActiveNote, refreshNotes]);

  useEffect(() => {
    void (async () => {
      try {
        const path = await getVaultPath();
        setVaultPathState(path);
        if (path) {
          const list = await refreshNotes();
          if (list.length > 0) {
            await loadNote(list[0].id);
          }
        }
      } finally {
        setLoadingVault(false);
      }
    })();
  }, [loadNote, refreshNotes]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (vaultPath) {
          void handleNewNote();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNewNote, vaultPath]);

  if (loadingVault) {
    return <div className="app-loading">Loading…</div>;
  }

  if (!vaultPath) {
    return <VaultGate onChooseFolder={() => void pickFolder()} busy={folderBusy} />;
  }

  return (
    <div className="app">
      <Sidebar
        notes={notes}
        activeNote={activeNote}
        onSelect={(id) => void loadNote(id)}
        onNewNote={() => void handleNewNote()}
        onChangeFolder={() => void pickFolder()}
      />
      <Editor
        noteName={activeNote}
        content={content}
        onChange={setContent}
        saveStatus={saveStatus}
        focusKey={editorFocusKey}
      />
    </div>
  );
}

export default App;
