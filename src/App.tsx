import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import { LazyStore } from '@tauri-apps/plugin-store';

import "./App.css";
import Editor from "./components/editor";
import Sidebar from "./components/sidebar";
import { Note } from "./types/note";

const App = () => {
  const store = new LazyStore('config.json');

  const [vaultPath, setVaultPath] : [String|null, any] = useState(null);
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedNoteContent, setSelectedNoteContent] = useState<string>('');

  useEffect(() => {
    if(selectedNote) {
      setSelectedNoteContent(selectedNote.content);
    }
  }, [selectedNote])

  const loadNotesFromVault = async () => {
    const vaultPathFromConfig : string|undefined = await store.get("vaultPath");

    if (!vaultPathFromConfig) return;
    setVaultPath(vaultPathFromConfig);
    
    const notesList : Note[] = await invoke('load_notes', { vaultPath: vaultPathFromConfig });

    if(!notesList) return;
    setNotesList(notesList);
  }

  const handleSelectNote = async (note: Note) => {
    setSelectedNote(note);
    const noteContent : string = await invoke('load_note_content', {notePath: `${vaultPath}/${note.name}`});

    if(!noteContent) return;

    setSelectedNote(note);
    setSelectedNoteContent(noteContent);
  }

  const handleSelectedNoteContentChange = (content: string) => {
    setSelectedNoteContent(content);
  }

  const handleSelectVault = async () => {
    const vaultDir = await open({
      multiple: false,
      directory: true,
    });

    if(!vaultDir) return;

    await store.set("vaultPath", vaultDir);
    await store.save();
    setVaultPath(vaultDir);   
  }

  useEffect(() => {
    loadNotesFromVault() 
  }, [])
  

  return (
    <main className="main">
      <div className="container">
        <Sidebar 
          handleSelectVault={handleSelectVault} 
          vaultPath={vaultPath} 
          notesList={notesList}
          selectedNote={selectedNote || {name: '', content: ''}}
          handleSelectNote={handleSelectNote}
        />
        <Editor 
          selectedNote={selectedNote || {name: '', content: ''}}
          selectedNoteContent={selectedNoteContent}
          handleSelectedNoteContentChange={handleSelectedNoteContentChange}
        />
      </div>
    </main>
  );
}

export default App;
