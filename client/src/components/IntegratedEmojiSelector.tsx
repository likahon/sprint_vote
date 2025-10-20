import React, { useState } from "react";
import { EMOJI_OPTIONS } from "../types";

interface IntegratedEmojiSelectorProps {
  selectedEmoji: string | null;
  onEmojiSelect: (emoji: string) => void;
}

export const IntegratedEmojiSelector: React.FC<
  IntegratedEmojiSelectorProps
> = ({ selectedEmoji, onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="integrated-emoji-selector">
      <div className="emoji-trigger" onClick={toggleDropdown}>
        <span className="emoji-display">{selectedEmoji || "😀"}</span>
        <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div className="emoji-dropdown">
          <div className="emoji-grid">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className={`emoji-option ${
                  selectedEmoji === emoji ? "selected" : ""
                } ${hoveredEmoji === emoji ? "hovered" : ""}`}
                onClick={() => handleEmojiClick(emoji)}
                onMouseEnter={() => setHoveredEmoji(emoji)}
                onMouseLeave={() => setHoveredEmoji(null)}
                title={emoji}
              >
                <span className="emoji">{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
