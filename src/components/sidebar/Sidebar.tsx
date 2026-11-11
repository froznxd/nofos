import { useCallback, useState } from 'react';
import './style.css';
import { invoke } from '@tauri-apps/api/core';
import { Note } from '../../types/note';

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 520;
const SIDEBAR_DEFAULT_WIDTH = 300;

interface SidebarProps {
    handleSelectVault: () => void;
    vaultPath: string | null;
    notesList: Note[];
    handleSelectNote: (note: Note) => void;
    selectedNote: Note;
}

const Sidebar = ({ handleSelectVault, notesList, handleSelectNote, selectedNote }: SidebarProps) => {
    const [width, setWidth] = useState(SIDEBAR_DEFAULT_WIDTH);

    const createNote = () => {
        invoke('create_note');
    }

    const startResize = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            const startX = event.clientX;
            const startWidth = width;

            const onMouseMove = (moveEvent: MouseEvent) => {
                const next = startWidth + (moveEvent.clientX - startX);
                setWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, next)));
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        [width],
    );

    const renderNotesList = (list: Array<Note>) => {
        return (
            <>
                {
                    list.map((note) => (
                        <div 
                            key={note.name} 
                            className={`sidebar-item ${selectedNote.name === note.name ? "active" : ""}`}
                            onClick={() => handleSelectNote(note)}
                        >
                            <span>{note.name}</span>
                        </div>
                    ))
                }
            </>
        )
    }

    

    return (
        <div className="sidebar" style={{ width }}>
            <div className="sidebar-header">
                <span>nofos</span>
                <button className="new-note-button" onClick={createNote}>+ New Note</button>
                <button className="change-vault-button" onClick={handleSelectVault}>Change folder...</button>
            </div>
            <div className="sidebar-container">
                {renderNotesList(notesList)}
            </div>
            <div
                className="sidebar-resizer"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
                onMouseDown={startResize}
            />
        </div>
    )
}

export default Sidebar;