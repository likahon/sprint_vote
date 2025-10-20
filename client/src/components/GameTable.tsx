import React, { useState, useRef, useEffect } from "react";
import { Room, User, VOTE_OPTIONS } from "../types";
import { useSocket } from "../hooks/useSocket";
import { IntegratedEmojiSelector } from "./IntegratedEmojiSelector";
import { FlyingEmoji } from "./FlyingEmoji";

interface GameTableProps {
  room: Room;
  currentUser: User;
}

export const GameTable: React.FC<GameTableProps> = ({ room, currentUser }) => {
  const { vote, revealVotes, resetVotes, sendEmoji, socket } = useSocket();
  const [selectedVote, setSelectedVote] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [flyingEmojis, setFlyingEmojis] = useState<Array<{
    id: string;
    emoji: string;
    fromPosition: { x: number; y: number };
    toPosition: { x: number; y: number };
    targetUserId: string;
    fromUserId: string;
  }>>([]);
  const [bouncingCard, setBouncingCard] = useState<string | null>(null);
  const userCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Debug: Log selectedEmoji state changes
  useEffect(() => {
    console.log("=== SELECTED EMOJI STATE CHANGED ===");
    console.log("Selected emoji changed to:", selectedEmoji);
    console.log("Type:", typeof selectedEmoji);
  }, [selectedEmoji]);

  // Escuchar emojis volando de otros usuarios
  useEffect(() => {
    if (!socket) return;

    const handleEmojiFlying = (data: {
      emoji: string;
      fromPosition: { x: number; y: number };
      toPosition: { x: number; y: number };
      fromUserId: string;
      fromUserName: string;
      toUserId: string;
      id: string;
    }) => {
      console.log("🚀 GameTable received flying emoji from another user:", data);
      console.log("🚀 Current user ID:", currentUser.id);
      console.log("🚀 From user ID:", data.fromUserId);
      console.log("🚀 Should show animation:", data.fromUserId !== currentUser.id);
      
      // Solo mostrar la animación si no es del usuario actual
      if (data.fromUserId !== currentUser.id) {
        console.log("🚀 Adding flying emoji to state");
        const newFlyingEmoji = {
          id: data.id,
          emoji: data.emoji,
          fromPosition: data.fromPosition,
          toPosition: data.toPosition,
          targetUserId: data.toUserId,
          fromUserId: data.fromUserId,
        };

        setFlyingEmojis(prev => {
          console.log("🚀 Previous flying emojis:", prev.length);
          console.log("🚀 Adding new emoji:", newFlyingEmoji);
          return [...prev, newFlyingEmoji];
        });
      } else {
        console.log("🚀 Skipping emoji from current user");
      }
    };

    socket.on('emoji-flying', handleEmojiFlying);

    return () => {
      socket.off('emoji-flying', handleEmojiFlying);
    };
  }, [socket, currentUser.id]);

  const handleVote = (voteValue: string) => {
    setSelectedVote(voteValue);
    vote(currentUser.id, voteValue);
  };

  const handleRevealVotes = () => {
    console.log("Revealing votes...", {
      canReveal,
      canRevealWithVotes,
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
      x: event.clientX, // Coordenada X exacta del click del mouse
      y: event.clientY, // Coordenada Y exacta del click del mouse
    };

    // Calcular posición de origen desde el costado de la pantalla
    // Determinar desde qué lado viene basado en la posición del usuario
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calcular desde qué lado viene el emoji
    const isLeftSide = userCardRect.left < screenWidth / 2;
    const isTopSide = userCardRect.top < screenHeight / 2;

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

    setFlyingEmojis(prev => [...prev, newFlyingEmoji]);
  };

  const handleEmojiSelect = (emoji: string) => {
    console.log("Emoji selected:", emoji);
    setSelectedEmoji(emoji);
    console.log("Selected emoji state updated to:", emoji);
  };

  const handleFlyingEmojiComplete = (emojiId: string) => {
    console.log("Flying emoji animation completed for ID:", emojiId);

    // Encontrar el emoji que completó su animación
    const completedEmoji = flyingEmojis.find(emoji => emoji.id === emojiId);
    if (completedEmoji) {
      // Solo enviar al servidor si es un emoji que lanzó el usuario actual
      // Los emojis de otros usuarios ya fueron enviados por ellos
      if (completedEmoji.fromUserId === currentUser.id) {
        sendEmoji(
          completedEmoji.targetUserId, 
          completedEmoji.emoji,
          completedEmoji.fromPosition,
          completedEmoji.toPosition
        );
      }
      
      // Remover el emoji de la lista
      setFlyingEmojis(prev => prev.filter(emoji => emoji.id !== emojiId));
    }
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

  const allUsersVoted = room.users.every((user) => user.hasVoted);
  const canReveal = currentUser.isAdmin && allUsersVoted && !room.votesRevealed;
  const canReset = currentUser.isAdmin && room.votesRevealed;

  // Si es admin y hay al menos un voto, puede revelar
  const canRevealWithVotes =
    currentUser.isAdmin &&
    room.users.some((user) => user.hasVoted) &&
    !room.votesRevealed;

  return (
    <div className="game-table">
      {/* Header */}
      <div className="table-header">
        <h2>Mesa de Planning Poker</h2>
        <div className="room-info">
          <span>Usuarios: {room.users.length}</span>
          {currentUser.isAdmin && (
            <span className="admin-badge">👑 Administrador</span>
          )}
        </div>
      </div>

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
                className={`card ${room.votesRevealed ? "revealed" : "hidden"}`}
              >
                {room.votesRevealed ? (
                  <span className="card-value">{user.vote || "?"}</span>
                ) : (
                  <span className="card-back">🂠</span>
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

      {/* Opciones de votación */}
      <div className="voting-options">
        <div className="voting-header">
          <h3>Selecciona tu carta:</h3>
          <IntegratedEmojiSelector
            selectedEmoji={selectedEmoji}
            onEmojiSelect={handleEmojiSelect}
          />
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
          {room.users.length === 1 && (
            <div className="admin-info">
              <p>
                👑 Eres el administrador. Vota primero y luego podrás revelar tu
                carta.
              </p>
            </div>
          )}

          {(canReveal || canRevealWithVotes) && (
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

      {/* Botón para salir */}
      <button className="leave-btn" onClick={() => window.location.reload()}>
        Salir de la Mesa
      </button>

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
