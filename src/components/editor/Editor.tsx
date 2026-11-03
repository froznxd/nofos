import { useState } from 'react';
import './style.css';

const Editor = () => {
    const [noteTitle, setNoteTitle] = useState('notes-01-02-2026.md');
    const [noteContent, setNoteContent] = useState('');

    return (
        <div className="editor">
            <div className="editor-header">{noteTitle}</div>
            <textarea 
                // placeholder="Write your code here..."
                className="editor-textarea"
                spellCheck={false}
                autoFocus={true}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
            >
            </textarea>
        </div>
    )
} 

export default Editor;