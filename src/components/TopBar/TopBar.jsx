import { useState } from "react";
import { FaSpotify } from "react-icons/fa";
import {
  MdInventory2,
  MdOutlineInventory2,
  MdOutlineDownloadForOffline,
} from "react-icons/md";
import { GoHome, GoHomeFill } from "react-icons/go";
import { FiSearch, FiBell, FiUsers } from "react-icons/fi";
import "./TopBar.css";

function TopBar({ query, onQueryChange }) {
  const [activePage, setActivePage] = useState("home");

  return (
    <header className="topbar">
      <div className="topbar__left">
        <a href="/" className="topbar__logo" aria-label="Home">
          <FaSpotify size={34} />
        </a>
      </div>

      <div className="topbar__center">
        <button
          className={`topbar__home ${activePage === "home" ? "topbar__home--active" : ""}`}
          aria-label="Home"
          onClick={() => setActivePage("home")}
        >
          {activePage === "home" ? <GoHomeFill size={26} /> : <GoHome size={26} />}
        </button>

        <div className="topbar__search">
          <span className="topbar__search-icon">
            <FiSearch size={22} />
          </span>
          <input
            type="text"
            placeholder="What do you want to play?"
            aria-label="Search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <button
            className={`topbar__browse ${activePage === "browse" ? "topbar__browse--active" : ""}`}
            aria-label="Browse"
            onClick={() => setActivePage("browse")}
          >
            {activePage === "browse" ? (
              <MdInventory2 size={22} />
            ) : (
              <MdOutlineInventory2 size={22} />
            )}
          </button>
        </div>
      </div>

      <nav className="topbar__right">
        <button className="topbar__premium">Explore Premium</button>
        <button className="topbar__install">
          <MdOutlineDownloadForOffline size={16} />
          Install App
        </button>
        <button className="topbar__icon-btn" aria-label="What's New">
          <FiBell size={16} />
        </button>
        <button className="topbar__icon-btn" aria-label="Friend Activity">
          <FiUsers size={18} />
        </button>
        <button className="topbar__avatar" aria-label="Profile">
          <span>N</span>
        </button>
      </nav>
    </header>
  );
}

export default TopBar;