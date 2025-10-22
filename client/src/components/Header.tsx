import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { HamburgerMenu } from "./HamburgerMenu";
import "./Header.css";
import logo from "../assets/cv-blanco.png";

interface HeaderProps {
  onLeave?: () => void;
  showLeaveButton?: boolean;
  onSettings?: () => void;
  showSettings?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLeave,
  showLeaveButton = false,
  onSettings,
  showSettings = false,
}) => {
  return (
    <header className="app-header">
      <div className="header-logo">
        <img src={logo} alt="Planning Poker Logo" className="logo-image" />
        <span className="logo-text">Cloudvalley</span>
      </div>

      <div className="header-title">
        <h1>MorsiPlanning</h1>
      </div>

      <div className="header-actions">
        <ThemeToggle />
        {showLeaveButton && (
          <HamburgerMenu
            onLeave={onLeave}
            onSettings={onSettings}
            showSettings={showSettings}
          />
        )}
      </div>
    </header>
  );
};
