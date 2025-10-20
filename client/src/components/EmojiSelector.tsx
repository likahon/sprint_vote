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
  const [isHovered, setIsHovered] = useState(false);

  console.log(
    "EmojiSelector render - isVisible:",
    isVisible,
    "position:",
    position
  );

  if (!isVisible) {
    console.log("EmojiSelector not visible, returning null");
    return null;
  }

  console.log("EmojiSelector rendering at position:", position);

  const handleEmojiClick = (emoji: string) => {
    console.log("Emoji clicked:", emoji);
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <>
      {/* Overlay para cerrar al hacer click fuera */}
      <div className="emoji-overlay" onClick={onClose} />

      {/* Selector de emojis */}
      <div
        className="emoji-selector"
        style={{
          left: position.x,
          top: position.y,
        }}
        // No cerrar automáticamente - solo se cierra al hacer clic en emoji o fuera
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
