import React, { useState } from "react";
import { Room, User, VOTE_OPTIONS } from "../types";
import { useSocket } from "../hooks/useSocket";

interface GameTableProps {
  room: Room;
  currentUser: User;
}

export const GameTable: React.FC<GameTableProps> = ({ room, currentUser }) => {
  const { vote, revealVotes, resetVotes } = useSocket();
  const [selectedVote, setSelectedVote] = useState<string>("");

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
              className={`user-card ${user.isAdmin ? "admin" : ""} ${
                user.id === currentUser.id ? "current-user" : ""
              }`}
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
            </div>
          ))}
        </div>
      </div>

      {/* Opciones de votación */}
      <div className="voting-options">
        <h3>Selecciona tu carta:</h3>
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
    </div>
  );
};
