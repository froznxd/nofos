import type { NoteMeta } from "../lib/tauriNotes";

interface SidebarProps {
  notes: NoteMeta[];
  activeNote: string | null;
  onSelect: (id: string) => void;
  onNewNote: () => void;
  onChangeFolder: () => void;
}

export function Sidebar({
  notes,
  activeNote,
  onSelect,
  onNewNote,
  onChangeFolder,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-actions">
        <button type="button" className="btn" onClick={onNewNote}>
          + New
        </button>
        <button type="button" className="btn btn-ghost" onClick={onChangeFolder}>
          Change folder…
        </button>
      </div>
      <ul className="note-list">
        {notes.length === 0 ? (
          <li className="note-list-empty">No notes yet</li>
        ) : (
          notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                className={`note-item${activeNote === note.id ? " active" : ""}`}
                onClick={() => onSelect(note.id)}
              >
                {note.title}
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
