import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Room, User, VOTE_OPTIONS, ANIMATION_CONFIG } from "../types";
import { useSocket } from "../hooks/useSocket";
import { useEmojiAnimation } from "../hooks/useEmojiAnimation";
import { IntegratedEmojiSelector } from "./IntegratedEmojiSelector";
import { FlyingEmoji } from "./FlyingEmoji";
import { VoteSummaryModal } from "./VoteSummaryModal";
import { SettingsModal } from "./SettingsModal";
import cardLogo from "../assets/CV-Celeste.png";
import cloudvalleyLogo from "../assets/CV-Celeste.png";

interface GameTableProps {
  room: Room;
  currentUser: User;
  socketData: ReturnType<typeof useSocket>;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  room,
  currentUser,
  socketData,
  showSettingsModal,
  setShowSettingsModal,
}) => {
  const {
    vote,
    revealVotes,
    resetVotes,
    sendEmoji,
    socket,
    toggleAllowVoteChange,
  } = socketData;
  const [selectedVote, setSelectedVote] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    "cloudvalley"
  );
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const userCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const prevVotesRevealed = useRef<boolean>(room.votesRevealed);
  const lastClickTime = useRef<number>(0);

  const {
    flyingEmojis,
    bouncingCard,
    handleFlyingEmojiComplete,
    triggerCardBounce,
  } = useEmojiAnimation({
    socket,
    currentUserId: currentUser.id,
    userCardRefs,
  });

  // Abrir modal automáticamente cuando se revelan las cartas (solo cuando cambia de false a true)
  useEffect(() => {
    if (!prevVotesRevealed.current && room.votesRevealed) {
      setShowSummaryModal(true);
    } else if (!room.votesRevealed) {
      setShowSummaryModal(false);
    }

    prevVotesRevealed.current = room.votesRevealed;
  }, [room.votesRevealed]);

  useEffect(() => {
    if (!currentUser.hasVoted) {
      setSelectedVote("");
    }
  }, [currentUser.hasVoted]);

  const handleVote = useCallback(
    (voteValue: string) => {
      if (room.allowVoteChange || !currentUser.hasVoted) {
        setSelectedVote(voteValue);
        vote(currentUser.id, voteValue);
      }
    },
    [room.allowVoteChange, currentUser.hasVoted, currentUser.id, vote]
  );

  const handleRevealVotes = useCallback(() => {
    revealVotes();
  }, [revealVotes]);

  const handleResetVotes = useCallback(() => {
    resetVotes();
    setSelectedVote("");
  }, [resetVotes]);

  const handleUserCardClick = useCallback(
    (userId: string, event: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime.current < ANIMATION_CONFIG.DEBOUNCE_TIME) return;
      lastClickTime.current = now;

      if (userId === currentUser.id) return;
      if (!selectedEmoji) return;

      const userCardRect = event.currentTarget.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const isLeftSide = userCardRect.left < screenWidth / 2;

      sendEmoji(userId, selectedEmoji, isLeftSide, currentUser);
    },
    [currentUser, selectedEmoji, sendEmoji]
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setSelectedEmoji(emoji);
  }, []);

  const getVoteDisplay = useCallback(
    (user: User) => {
      if (room.votesRevealed) {
        return user.vote || "?";
      } else if (user.hasVoted) {
        return "✓";
      } else {
        return "⏳";
      }
    },
    [room.votesRevealed]
  );

  const canReset = currentUser.isAdmin && room.votesRevealed;
  const canReveal = currentUser.isAdmin && !room.votesRevealed;

  const voteSummary = useMemo(() => {
    const voteCounts: { [key: string]: number } = {};
    let totalVotes = 0;

    room.users.forEach((user) => {
      if (user.vote && user.vote !== "?") {
        voteCounts[user.vote] = (voteCounts[user.vote] || 0) + 1;
        totalVotes++;
      }
    });

    const sortedVotes = Object.entries(voteCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([vote, count]) => ({
        vote,
        count,
        percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
      }));

    return { sortedVotes, totalVotes };
  }, [room.users]);

  return (
    <div className="game-table">
      {/* Mesa central con cartas */}
      <div className="table-center">
        <div className="cards-area">
          {room.users.map((user) => (
            <div
              key={user.id}
              ref={(el) => (userCardRefs.current[user.id] = el)}
              className={`user-card ${user.isAdmin ? "admin" : ""} ${
                user.id === currentUser.id ? "current-user" : ""
              } ${
                user.id !== currentUser.id && selectedEmoji
                  ? "emoji-clickable"
                  : ""
              } ${bouncingCard === user.id ? "bouncing" : ""}`}
              onClick={(e) => handleUserCardClick(user.id, e)}
            >
              <div className="user-name">
                {user.name}
                {user.isAdmin && <span className="admin-crown">👑</span>}
              </div>
              <div
                className={`card ${
                  room.votesRevealed ? "revealed" : "hidden"
                } ${room.votesRevealed && !user.vote ? "no-vote" : ""}`}
              >
                {room.votesRevealed ? (
                  <span className="card-value">
                    {user.vote && user.vote !== "?" ? user.vote : "?"}
                  </span>
                ) : (
                  <img
                    src={cardLogo}
                    alt="Card back"
                    className="card-back-logo"
                  />
                )}
              </div>
              <div className="vote-status">{getVoteDisplay(user)}</div>
            </div>
          ))}
        </div>
      </div>

      <VoteSummaryModal
        isOpen={showSummaryModal && room.votesRevealed}
        onClose={() => setShowSummaryModal(false)}
        sortedVotes={voteSummary.sortedVotes}
        totalVotes={voteSummary.totalVotes}
      />

      <SettingsModal
        isOpen={showSettingsModal && currentUser.isAdmin}
        onClose={() => setShowSettingsModal(false)}
        allowVoteChange={room.allowVoteChange || false}
        onToggleAllowVoteChange={toggleAllowVoteChange}
      />

      {/* Opciones de votación */}
      <div className="voting-options">
        <div className="voting-header">
          <h3>Selecciona tu carta:</h3>
        </div>
        <div className="cards-grid">
          {VOTE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`card-option ${
                selectedVote === option.value ? "selected" : ""
              } ${
                currentUser.hasVoted && !room.allowVoteChange ? "disabled" : ""
              }`}
              onClick={() => handleVote(option.value)}
              disabled={
                room.votesRevealed ||
                (currentUser.hasVoted && !room.allowVoteChange)
              }
            >
              <span className="card-number">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Selector de emojis */}
        <div className="emoji-selector-container">
          <span className="emoji-selector-label">
            Seleccioná un emoji para lanzar:
          </span>
          <IntegratedEmojiSelector
            selectedEmoji={selectedEmoji}
            onEmojiSelect={handleEmojiSelect}
          />
        </div>

        {selectedEmoji && (
          <div className="emoji-instructions">
            <p>
              💡 Hacé clic en cualquier usuario para lanzarle{" "}
              {selectedEmoji === "cloudvalley" ? (
                <img
                  src={cloudvalleyLogo}
                  alt="Cloudvalley"
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    verticalAlign: "middle",
                    display: "inline-block",
                    marginLeft: "0.25rem",
                  }}
                />
              ) : (
                `el emoji ${selectedEmoji}`
              )}
            </p>
          </div>
        )}
      </div>

      {/* Controles de admin */}
      {currentUser.isAdmin && (
        <div className="admin-controls">
          {canReveal && (
            <button className="reveal-btn" onClick={handleRevealVotes}>
              🃏 Revelar Votaciones
            </button>
          )}

          {canReset && (
            <button className="reset-btn" onClick={handleResetVotes}>
              🔄 Reiniciar
            </button>
          )}
        </div>
      )}

      {/* Emojis volando - múltiples simultáneos */}
      {flyingEmojis.map((flyingEmoji) => (
        <FlyingEmoji
          key={flyingEmoji.id}
          emoji={flyingEmoji.emoji}
          fromPosition={flyingEmoji.fromPosition}
          toPosition={flyingEmoji.toPosition}
          onComplete={() => handleFlyingEmojiComplete(flyingEmoji.id)}
          onImpact={() => triggerCardBounce(flyingEmoji.targetUserId)}
        />
      ))}
    </div>
  );
};
