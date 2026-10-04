import { FiPlus } from "react-icons/fi";
import { VscLibrary } from "react-icons/vsc";
import { TbLayoutSidebarLeftExpand, TbLayoutSidebarLeftCollapse } from "react-icons/tb";
import "./Sidebar.css";

function Sidebar({ expanded, onToggle }) {
  // band (rail): sirf 2 icons
  if (!expanded) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <div className="sidebar__rail">
          <button
            className="sidebar__open"
            aria-label="Open Your Library"
            title="Open Your Library"
            onClick={onToggle}
          >
            <VscLibrary className="sidebar__open-default" size={24} />
            <TbLayoutSidebarLeftExpand className="sidebar__open-hover" size={24} />
          </button>
          <button className="sidebar__create" aria-label="Create" title="Create">
            <FiPlus size={16} />
          </button>
        </div>
      </aside>
    );
  }

  // khuli library
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <button
          className="sidebar__title"
          title="Collapse Your Library"
          onClick={onToggle}
        >
          <TbLayoutSidebarLeftCollapse className="sidebar__title-icon" size={24} />
          <span>Your Library</span>
        </button>
        <button className="sidebar__create" aria-label="Create" title="Create">
          <FiPlus size={16} />
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