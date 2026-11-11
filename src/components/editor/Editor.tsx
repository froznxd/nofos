import { useState } from 'react';
import './style.css';
import { Note } from '../../types/note';

interface EditorProps {
    selectedNote: Note;
    handleSelectedNoteContentChange: (content: string) => void;
    selectedNoteContent: string;
}

const Editor = ({selectedNote, handleSelectedNoteContentChange, selectedNoteContent} : EditorProps) => {

    return (
        <div className="editor">
            <div className="editor-header">{selectedNote.name}</div>
            <textarea 
                // placeholder="Write your code here..."
                className="editor-textarea"
                spellCheck={false}
                autoFocus={true}
                value={selectedNoteContent}
                onChange={(e) => handleSelectedNoteContentChange(e.target.value)}
            >
            </textarea>
        </div>
    )
} 

export default Editor;