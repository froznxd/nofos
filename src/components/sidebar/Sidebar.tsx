import './style.css';

const Sidebar = () => {

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <span>nofos</span>
                <button className="new-note-button">+ New Note</button>
            </div>
            <div className="sidebar-container">
                <div className="sidebar-item active">
                    <span>notes-01-02-2026</span>
                </div>
                <div className="sidebar-item">
                    <span>testing some hardware</span>
                </div>
                <div className="sidebar-item">
                    <span>todo for the week</span>
                </div>
                <div className="sidebar-item">
                    <span>notes-12-10-2026</span>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;