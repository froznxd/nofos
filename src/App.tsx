import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import { LazyStore } from '@tauri-apps/plugin-store';

import "./App.css";
import Editor from "./components/editor";
import Sidebar from "./components/sidebar";

const App = () => {
  const store = new LazyStore('config.json');

  const [vaultPath, setVaultPath] : [String|null, any] = useState(null);
  const [notesList, setNotesList] = useState([{}]);

  const loadVaultDir = async () => {
    const vaultPathFromConfig : string|undefined = await store.get("vaultPath");

    if (!vaultPathFromConfig) return;
    setVaultPath(vaultPathFromConfig);
  }

  const loadNotesFromVault = async () => {
    console.log(vaultPath)
    if(!vaultPath) return;
    
    const notesList : Array<Object> | undefined= await invoke('load_notes', { vaultPath });

    if(!notesList) return;
    
    setNotesList(notesList);
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
    loadVaultDir()
  }, [])

  useEffect(() => {
    loadNotesFromVault() 
  }, [vaultPath])
  

  return (
    <main className="main">
      <div className="container">
        <Sidebar 
          handleSelectVault={handleSelectVault} 
          vaultPath={vaultPath} 
          notesList={notesList}
        />
        <Editor />
      </div>
    </main>
  );
}

export default App;
