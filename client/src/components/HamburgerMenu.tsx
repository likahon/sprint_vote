import React, { useState, useRef, useEffect } from "react";
import "./HamburgerMenu.css";

interface HamburgerMenuProps {
  onLeave?: () => void;
  onSettings?: () => void;
  showSettings?: boolean;
  onUsers?: () => void;
  showUsers?: boolean;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onLeave,
  onSettings,
  showSettings,
  onUsers,
  showUsers,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLeave = () => {
    setIsOpen(false);
    if (onLeave) {
      onLeave();
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    if (onSettings) {
      onSettings();
    }
  };

  const handleUsers = () => {
    setIsOpen(false);
    if (onUsers) {
      onUsers();
    }
  };

  return (
    <div className="hamburger-menu" ref={menuRef}>
      <button
        className={`hamburger-button ${isOpen ? "open" : ""}`}
        onClick={toggleMenu}
        aria-label="Menú"
        aria-expanded={isOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      <div className={`menu-dropdown ${isOpen ? "open" : ""}`}>
        <ul className="menu-list">
          {showUsers && onUsers && (
            <li>
              <button className="menu-item" onClick={handleUsers}>
                <span className="menu-icon">👥</span>
                <span className="menu-text">Usuarios</span>
              </button>
            </li>
          )}
          {showSettings && onSettings && (
            <li>
              <button className="menu-item" onClick={handleSettings}>
                <span className="menu-icon">⚙️</span>
                <span className="menu-text">Settings</span>
              </button>
            </li>
          )}
          {onLeave && (
            <li>
              <button className="menu-item" onClick={handleLeave}>
                <span className="menu-icon">🚪</span>
                <span className="menu-text">Salir de la Mesa</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
