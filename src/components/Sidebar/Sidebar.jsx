import { FiPlus } from "react-icons/fi";
import { MdOutlineLibraryMusic } from "react-icons/md";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <MdOutlineLibraryMusic className="sidebar__lib-icon" size={24} />
        <h2>Your Library</h2>
        <button className="sidebar__create" aria-label="Create">
          <FiPlus size={18} />
          <span className="sidebar__create-label">Create</span>
        </button>
      </div>

      <div className="sidebar__card">
        <h3>Create your first playlist</h3>
        <p>It's easy, we'll help you</p>
        <button>Create playlist</button>
      </div>

      <div className="sidebar__card">
        <h3>Let's find some podcasts to follow</h3>
        <p>We'll keep you updated on new episodes</p>
        <button>Browse podcasts</button>
      </div>
    </aside>
  );
}

export default Sidebar;