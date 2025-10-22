import React, { useState } from "react";
import { EMOJI_OPTIONS } from "../types";

interface EmojiSelectorProps {
  isVisible: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  isVisible,
  onEmojiSelect,
  onClose,
  position,
}) => {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  if (!isVisible) {
    return null;
  }

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <>
      <div className="emoji-overlay" onClick={onClose} />

      <div
        className="emoji-selector"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="emoji-grid">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              className={`emoji-option ${
                hoveredEmoji === emoji ? "hovered" : ""
              }`}
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
    </>
  );
};
