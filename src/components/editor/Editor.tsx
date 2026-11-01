import './style.css';

const Editor = () => {
    return (
        <div className="editor">
            <div className="editor-header">notes-01-02-2026.md</div>
            <textarea 
                // placeholder="Write your code here..."
                className="editor-textarea"
                spellCheck={false}
                autoFocus={true}
            >
            </textarea>
        </div>
    )
} 

export default Editor;