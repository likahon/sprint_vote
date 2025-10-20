import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import "./ThemeToggle.css";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isRotating, setIsRotating] = useState(false);

  const handleToggle = () => {
    setIsRotating(true);
    toggleTheme();

    // Reset rotation animation after it completes
    setTimeout(() => {
      setIsRotating(false);
    }, 500);
  };

  return (
    <button
      className={`theme-toggle ${theme} ${isRotating ? "rotating" : ""}`}
      onClick={handleToggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};
