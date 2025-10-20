import React, { useState } from "react";
import { EMOJI_OPTIONS } from "../types";

interface FixedEmojiSelectorProps {
  selectedEmoji: string | null;
  onEmojiSelect: (emoji: string) => void;
}

export const FixedEmojiSelector: React.FC<FixedEmojiSelectorProps> = ({
  selectedEmoji,
  onEmojiSelect,
}) => {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <div className="fixed-emoji-selector">
      <div className="emoji-selector-header">
        <h3>Selecciona un emoji</h3>
        {selectedEmoji && (
          <div className="selected-emoji-display">
            <span>Emoji seleccionado: </span>
            <span className="selected-emoji">{selectedEmoji}</span>
          </div>
        )}
      </div>

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

      {selectedEmoji && (
        <div className="emoji-instructions">
          <p>💡 Haz clic en cualquier usuario para lanzarle el emoji</p>
        </div>
      )}
    </div>
  );
};
