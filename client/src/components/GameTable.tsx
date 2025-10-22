import React, { useState, useRef, useEffect } from "react";
import { Room, User, VOTE_OPTIONS } from "../types";
import { useSocket } from "../hooks/useSocket";
import { IntegratedEmojiSelector } from "./IntegratedEmojiSelector";
import { FlyingEmoji } from "./FlyingEmoji";
import cardLogo from "../assets/CV-Celeste.png";

interface GameTableProps {
  room: Room;
  currentUser: User;
  socketData: ReturnType<typeof useSocket>;
}

export const GameTable: React.FC<GameTableProps> = ({
  room,
  currentUser,
  socketData,
}) => {
  const { vote, revealVotes, resetVotes, sendEmoji, socket } = socketData;
  const [selectedVote, setSelectedVote] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [flyingEmojis, setFlyingEmojis] = useState<
    Array<{
      id: string;
      emoji: string;
      fromPosition: { x: number; y: number };
      toPosition: { x: number; y: number };
      targetUserId: string;
      fromUserId: string;
    }>
  >([]);
  const [bouncingCard, setBouncingCard] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const userCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const prevVotesRevealed = useRef<boolean>(room.votesRevealed);
  const lastClickTime = useRef<number>(0);

  // Debug: Log selectedEmoji state changes
  useEffect(() => {
    console.log("=== SELECTED EMOJI STATE CHANGED ===");
    console.log("Selected emoji changed to:", selectedEmoji);
    console.log("Type:", typeof selectedEmoji);
  }, [selectedEmoji]);

  // Abrir modal automáticamente cuando se revelan las cartas (solo cuando cambia de false a true)
  useEffect(() => {
    if (!prevVotesRevealed.current && room.votesRevealed) {
      // Solo abrir cuando cambia de false a true
      setShowSummaryModal(true);
    } else if (!room.votesRevealed) {
      // Cerrar cuando se resetean los votos
      setShowSummaryModal(false);
    }

    prevVotesRevealed.current = room.votesRevealed;
  }, [room.votesRevealed]);

  // Escuchar emojis volando de otros usuarios
  useEffect(() => {
    if (!socket) {
      console.log("❌ Socket not available in emoji-flying listener");
      return;
    }

    console.log("✅ Setting up emoji-flying listener on socket:", socket.id);

    const handleEmojiFlying = (data: {
      emoji: string;
      fromPosition: { x: number; y: number };
      toPosition: { x: number; y: number };
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      id: string;
    }) => {
      console.log(
        "🚀🚀🚀 GameTable received flying emoji from another user:",
        data
      );
      console.log("🚀 Current user ID:", currentUser.id);
      console.log("🚀 From user ID:", data.fromUserId);
      console.log(
        "🚀 Should show animation:",
        data.fromUserId !== currentUser.id
      );

      // Solo mostrar la animación si no es del usuario actual
      if (data.fromUserId !== currentUser.id) {
        console.log("🚀 Adding flying emoji to state");

        // Calcular el toPosition localmente usando la referencia de la carta
        const targetUserCardRef = userCardRefs.current[data.toUserId];
        let localToPosition = data.toPosition; // Fallback a la posición recibida

        if (targetUserCardRef) {
          const rect = targetUserCardRef.getBoundingClientRect();
          localToPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          console.log("🎯 Calculated local toPosition:", localToPosition);
        } else {
          console.log("⚠️ Target card ref not found, using received position");
        }

        const newFlyingEmoji = {
          id: data.id,
          emoji: data.emoji,
          fromPosition: data.fromPosition,
          toPosition: localToPosition, // Usar la posición local
          targetUserId: data.toUserId,
          fromUserId: data.fromUserId,
        };

        setFlyingEmojis((prev) => {
          // Verificar si el emoji ya existe (prevenir duplicados)
          const alreadyExists = prev.some((e) => e.id === data.id);
          if (alreadyExists) {
            console.log("🚫 Emoji already exists, skipping:", data.id);
            return prev;
          }

          console.log("🚀 Previous flying emojis:", prev.length);
          console.log("🚀 Adding new emoji:", newFlyingEmoji);
          return [...prev, newFlyingEmoji];
        });
      } else {
        console.log("🚀 Skipping emoji from current user");
      }
    };

    socket.on("emoji-flying", handleEmojiFlying);
    console.log("✅ emoji-flying listener registered successfully");

    return () => {
      console.log("🧹 Cleaning up emoji-flying listener");
      socket.off("emoji-flying", handleEmojiFlying);
    };
  }, [socket, currentUser.id]);

  const handleVote = (voteValue: string) => {
    setSelectedVote(voteValue);
    vote(currentUser.id, voteValue);
  };

  const handleRevealVotes = () => {
    console.log("Revealing votes...", {
      canReveal,
      currentUser,
      room,
    });
    revealVotes();
  };

  const handleResetVotes = () => {
    resetVotes();
    setSelectedVote("");
  };

  const handleUserCardClick = (userId: string, event: React.MouseEvent) => {
    console.log("=== USER CARD CLICKED ===");

    // Debounce: prevenir clics múltiples en menos de 300ms
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      console.log("⛔ Click too fast, ignoring (debounce)");
      return;
    }
    lastClickTime.current = now;

    console.log(
      "Clicked on user card:",
      userId,
      "Current user:",
      currentUser.id
    );
    console.log("Selected emoji at click time:", selectedEmoji);

    // Solo permitir lanzar emojis a otros usuarios
    if (userId === currentUser.id) {
      console.log("Cannot send emoji to yourself");
      return;
    }

    // Verificar que hay un emoji seleccionado
    if (!selectedEmoji) {
      console.log("=== NO EMOJI SELECTED ===");
      console.log("selectedEmoji value:", selectedEmoji);
      console.log("selectedEmoji type:", typeof selectedEmoji);
      console.log("selectedEmoji === null:", selectedEmoji === null);
      console.log("selectedEmoji === undefined:", selectedEmoji === undefined);
      console.log("selectedEmoji === '':", selectedEmoji === "");
      return;
    }

    const userCardRect = event.currentTarget.getBoundingClientRect();
    const targetPosition = {
      x: userCardRect.left + userCardRect.width / 2, // Centro de la carta
      y: userCardRect.top + userCardRect.height / 2, // Centro de la carta
    };

    // Calcular posición de origen desde el costado de la pantalla
    // Determinar desde qué lado viene basado en la posición del usuario
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calcular desde qué lado viene el emoji
    const isLeftSide = userCardRect.left < screenWidth / 2;
    // const isTopSide = userCardRect.top < screenHeight / 2;

    let fromPosition;

    if (isLeftSide) {
      // Viene desde la izquierda
      fromPosition = {
        x: -20, // Más cerca de la pantalla
        y: event.clientY, // Misma altura que el click del mouse
      };
    } else {
      // Viene desde la derecha
      fromPosition = {
        x: screenWidth + 20, // Más cerca de la pantalla
        y: event.clientY, // Misma altura que el click del mouse
      };
    }

    console.log("Launching emoji:", selectedEmoji, "to user:", userId);
    console.log("From position (side):", fromPosition);
    console.log("To position (mouse click):", targetPosition);
    console.log("Mouse coordinates:", { x: event.clientX, y: event.clientY });
    console.log("Screen dimensions:", {
      width: screenWidth,
      height: screenHeight,
    });
    console.log("User card position:", {
      left: userCardRect.left,
      top: userCardRect.top,
    });
    console.log("Is left side:", isLeftSide);

    // Crear un nuevo emoji volando (permitir múltiples simultáneos)
    const newFlyingEmoji = {
      id: `${Date.now()}-${Math.random()}`, // ID único para cada emoji
      emoji: selectedEmoji,
      fromPosition,
      toPosition: targetPosition,
      targetUserId: userId,
      fromUserId: currentUser.id,
    };

    setFlyingEmojis((prev) => [...prev, newFlyingEmoji]);

    // ¡IMPORTANTE! Enviar el emoji al servidor para que otros usuarios lo vean
    console.log("⚡ CALLING sendEmoji to broadcast to other users");
    console.log("⚡ Passing currentUser:", currentUser);
    sendEmoji(userId, selectedEmoji, fromPosition, targetPosition, currentUser);
  };

  const handleEmojiSelect = (emoji: string) => {
    console.log("Emoji selected:", emoji);
    setSelectedEmoji(emoji);
    console.log("Selected emoji state updated to:", emoji);
  };

  const handleFlyingEmojiComplete = (emojiId: string) => {
    console.log("Flying emoji animation completed for ID:", emojiId);

    // Remover el emoji de la lista (ya fue enviado al servidor cuando se hizo clic)
    setFlyingEmojis((prev) => prev.filter((emoji) => emoji.id !== emojiId));
  };

  // Función para activar el rebote cuando el emoji choca
  const triggerCardBounce = (userId: string) => {
    setBouncingCard(userId);
    setTimeout(() => {
      setBouncingCard(null);
    }, 600);
  };

  const getVoteDisplay = (user: User) => {
    if (room.votesRevealed) {
      return user.vote || "?";
    } else if (user.hasVoted) {
      return "✓";
    } else {
      return "⏳";
    }
  };

  const canReset = currentUser.isAdmin && room.votesRevealed;

  // El admin puede revelar en cualquier momento, incluso si nadie ha votado
  // (esto permite revelar cartas con "?" para todos los que no votaron)
  const canReveal = currentUser.isAdmin && !room.votesRevealed;

  // Calcular resumen de votos
  const getVoteSummary = () => {
    const voteCounts: { [key: string]: number } = {};
    let totalVotes = 0;

    room.users.forEach((user) => {
      if (user.vote && user.vote !== "?") {
        voteCounts[user.vote] = (voteCounts[user.vote] || 0) + 1;
        totalVotes++;
      }
    });

    // Ordenar por número de votos (descendente)
    const sortedVotes = Object.entries(voteCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([vote, count]) => ({
        vote,
        count,
        percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
      }));

    return { sortedVotes, totalVotes };
  };

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

              {/* Mostrar emojis recibidos */}
              {user.emojis && user.emojis.length > 0 && (
                <div className="user-emojis">
                  {user.emojis.slice(-3).map((emoji, index) => (
                    <span
                      key={`${emoji.id}-${index}`}
                      className="emoji-reaction"
                      title={`${emoji.fromUserName}: ${emoji.emoji}`}
                    >
                      {emoji.emoji}
                    </span>
                  ))}
                  {user.emojis.length > 3 && (
                    <span className="emoji-more">
                      +{user.emojis.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de resumen de votaciones */}
      {showSummaryModal && room.votesRevealed && (
        <div
          className="summary-modal-overlay"
          onClick={() => setShowSummaryModal(false)}
        >
          <div
            className="summary-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="summary-modal-close"
              onClick={() => setShowSummaryModal(false)}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <h3 className="summary-title">📊 Resumen de Votaciones</h3>
            <div className="summary-stats">
              {(() => {
                const { sortedVotes, totalVotes } = getVoteSummary();

                if (sortedVotes.length === 0) {
                  return <p className="no-votes">No hay votos registrados</p>;
                }

                return (
                  <>
                    <div className="votes-grid">
                      {sortedVotes.map(({ vote, count, percentage }, index) => {
                        // Detectar si hay empate en el primer lugar
                        const maxCount = sortedVotes[0].count;
                        const tiedVotes = sortedVotes.filter(
                          (v) => v.count === maxCount
                        );
                        const isTied = tiedVotes.length > 1;
                        const isWinner = index === 0 && !isTied;

                        return (
                          <div
                            key={vote}
                            className={`vote-item ${
                              index === 0 ? "most-voted" : ""
                            }`}
                          >
                            <div className="vote-card">
                              <span className="vote-value">{vote}</span>
                            </div>
                            <div className="vote-info">
                              <div className="vote-count">
                                {count} {count === 1 ? "voto" : "votos"}
                              </div>
                              <div className="vote-bar-container">
                                <div
                                  className="vote-bar"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="vote-percentage">
                                {percentage.toFixed(0)}%
                              </div>
                            </div>
                            {isWinner && (
                              <div className="most-voted-badge">
                                🏆 Más votada
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="total-votes">
                      Total de votos: <strong>{totalVotes}</strong>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="summary-modal-actions">
              <button
                className="summary-modal-btn"
                onClick={() => setShowSummaryModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
              } ${currentUser.hasVoted ? "disabled" : ""}`}
              onClick={() => handleVote(option.value)}
              disabled={currentUser.hasVoted || room.votesRevealed}
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
              💡 Haz clic en cualquier usuario para lanzarle el emoji{" "}
              {selectedEmoji}
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
