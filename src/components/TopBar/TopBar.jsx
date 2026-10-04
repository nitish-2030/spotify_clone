import { useState, useRef } from "react";
import { FaSpotify } from "react-icons/fa";
import {
  MdInventory2,
  MdOutlineInventory2,
  MdOutlineDownloadForOffline,
} from "react-icons/md";
import { GoHome, GoHomeFill } from "react-icons/go";
import { FiSearch, FiMenu } from "react-icons/fi";
import "./TopBar.css";

function TopBar({ query, onQueryChange }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const inputRef = useRef(null);

  function openSearch() {
    setSearchOpen(true);
    inputRef.current.focus();
  }

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

        <div
          className={`topbar__search ${searchOpen ? "topbar__search--open" : ""}`}
        >
          <button
            className="topbar__search-icon"
            aria-label="Search"
            onClick={openSearch}
          >
            <FiSearch size={22} />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to play?"
            aria-label="Search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onBlur={() => setSearchOpen(false)}
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
        <div className="topbar__links">
          <a href="#" className="topbar__extra">Premium</a>
          <a href="#" className="topbar__extra">Support</a>
          <a href="#" className="topbar__extra">Download</a>
          <span className="topbar__divider topbar__extra" />
          <a href="#" className="topbar__install">
            <MdOutlineDownloadForOffline size={16} />
            Install App
          </a>
        </div>
        <button className="topbar__signup">Sign up</button>
        <button className="topbar__login">Log in</button>
        <button className="topbar__menu" aria-label="Menu">
          <FiMenu size={16} />
        </button>
      </nav>
    </header>
  );
}

export default TopBar;