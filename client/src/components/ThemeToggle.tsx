import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import "./ThemeToggle.css";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle-switch ${theme}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="switch-track">
        {/* Estrellas para modo noche */}
        <div className="stars">
          {[...Array(12)].map((_, i) => (
            <span key={i} className={`star star-${i + 1}`}>
              ✦
            </span>
          ))}
        </div>
        
        {/* Nubes para modo día */}
        <div className="clouds">
          <span className="cloud cloud-1">☁️</span>
          <span className="cloud cloud-2">☁️</span>
        </div>

        {/* El círculo deslizante con sol/luna */}
        <div className="switch-thumb">
          {theme === "dark" ? (
            <div className="moon">🌙</div>
          ) : (
            <div className="sun">☀️</div>
          )}
        </div>
      </div>
    </button>
  );
};
