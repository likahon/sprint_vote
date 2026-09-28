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
import { useTheme } from "../contexts/ThemeContext";
import { IntegratedEmojiSelector } from "./IntegratedEmojiSelector";
import { FlyingEmoji } from "./FlyingEmoji";
import { VoteSummaryModal } from "./VoteSummaryModal";
import { SettingsModal } from "./SettingsModal";
import cardLogoDark from "../assets/logo_dark.svg";
import cardLogoLight from "../assets/logo_light.png";
import cloudvalleyLogo from "../assets/logo_dark.svg";

interface GameTableProps {
  room: Room;
  currentUser: User;
  socketData: ReturnType<typeof useSocket>;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  selectedEmoji: string | null;
  onEmojiSelect: (emoji: string) => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  room,
  currentUser,
  socketData,
  showSettingsModal,
  setShowSettingsModal,
  selectedEmoji,
  onEmojiSelect,
}) => {
  const { theme } = useTheme();
  const cardLogo = theme === "dark" ? cardLogoDark : cardLogoLight;
  const {
    vote,
    revealVotes,
    resetVotes,
    sendEmoji,
    socket,
    toggleAllowVoteChange,
  } = socketData;
  const [selectedVote, setSelectedVote] = useState<string>("");
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

  const canVote =
    currentUser.role !== "Product Owner" && currentUser.role !== "Observer";
  const canManageVotes =
    currentUser.role === "Admin" || currentUser.role === "Co Admin";

  const handleVote = useCallback(
    (voteValue: string) => {
      if (!canVote) return;
      if (room.allowVoteChange || !currentUser.hasVoted) {
        setSelectedVote(voteValue);
        vote(currentUser.id, voteValue);
      }
    },
    [canVote, room.allowVoteChange, currentUser.hasVoted, currentUser.id, vote],
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
    [currentUser, selectedEmoji, sendEmoji],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onEmojiSelect(emoji);
    },
    [onEmojiSelect],
  );

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
    [room.votesRevealed],
  );

  const canReset = canManageVotes && room.votesRevealed;
  const canReveal = canManageVotes && !room.votesRevealed;

  const voteSummary = useMemo(() => {
    const voteCounts: { [key: string]: number } = {};
    let totalVotes = 0;

    room.users.forEach((user) => {
      if (user.role !== "Product Owner" && user.role !== "Observer") {
        if (user.vote && user.vote !== "?") {
          voteCounts[user.vote] = (voteCounts[user.vote] || 0) + 1;
          totalVotes++;
        }
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

      {/* Cartas de votación */}
      <div className="voting-options">
        {!canVote && (
          <div className="role-voting-restriction">
            <p>
              ⚠️ Tu rol no te permite votar. Solo puedes observar las
              votaciones.
            </p>
          </div>
        )}
        <div className="cards-grid">
          {VOTE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`card-option ${
                selectedVote === option.value ? "selected" : ""
              } ${!canVote ? "role-disabled" : ""}`}
              onClick={() => handleVote(option.value)}
              disabled={
                !canVote ||
                room.votesRevealed ||
                (currentUser.hasVoted && !room.allowVoteChange)
              }
            >
              <span className="card-number">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controles de admin */}
      {canReveal && (
        <div className="admin-controls-compact">
          <button className="reveal-btn" onClick={handleRevealVotes}>
            🃏 Revelar Votaciones
          </button>
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
