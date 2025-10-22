import React, { useState, useMemo, useRef, useEffect } from "react";
import { EMOJI_OPTIONS } from "../types";
import { EMOJI_NAMES } from "../data/emojiNames";
import cloudvalleyLogo from "../assets/CV-Celeste.png";

interface IntegratedEmojiSelectorProps {
  selectedEmoji: string | null;
  onEmojiSelect: (emoji: string) => void;
}

export const IntegratedEmojiSelector: React.FC<
  IntegratedEmojiSelectorProps
> = ({ selectedEmoji, onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) {
      return EMOJI_OPTIONS;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return EMOJI_OPTIONS.filter((emoji) => {
      const emojiName = EMOJI_NAMES[emoji] || "";
      return emojiName.toLowerCase().includes(searchLower);
    });
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  const renderEmoji = (emoji: string, className: string = "") => {
    if (emoji === 'cloudvalley') {
      return (
        <img 
          src={cloudvalleyLogo} 
          alt="Cloudvalley" 
          className={`custom-emoji-image ${className}`}
        />
      );
    }
    return <span className={className}>{emoji}</span>;
  };

  return (
    <div className="integrated-emoji-selector" ref={dropdownRef}>
      <div className="emoji-trigger" onClick={toggleDropdown}>
        <span className="emoji-display">
          {renderEmoji(selectedEmoji || "cloudvalley", "")}
        </span>
        <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div className="emoji-dropdown">
          <div className="emoji-search-container">
            <input
              ref={searchInputRef}
              type="text"
              className="emoji-search-input"
              placeholder="Buscar emoji... (ej: amor, risa, fuego)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="emoji-grid">
            {filteredEmojis.length > 0 ? (
              filteredEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  className={`emoji-option ${
                    selectedEmoji === emoji ? "selected" : ""
                  } ${hoveredEmoji === emoji ? "hovered" : ""}`}
                  onClick={() => handleEmojiClick(emoji)}
                  onMouseEnter={() => setHoveredEmoji(emoji)}
                  onMouseLeave={() => setHoveredEmoji(null)}
                  title={EMOJI_NAMES[emoji] || emoji}
                >
                  {renderEmoji(emoji, "emoji")}
                </button>
              ))
            ) : (
              <div className="no-emojis-found">
                No se encontraron emojis para "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
