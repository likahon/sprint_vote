import React from "react";
import { VoteSummaryItem } from "../types";

interface VoteSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortedVotes: VoteSummaryItem[];
  totalVotes: number;
}

export const VoteSummaryModal: React.FC<VoteSummaryModalProps> = ({
  isOpen,
  onClose,
  sortedVotes,
  totalVotes,
}) => {
  if (!isOpen) return null;

  const hasNoVotes = sortedVotes.length === 0;
  const maxCount = sortedVotes[0]?.count || 0;
  const tiedVotes = sortedVotes.filter((v) => v.count === maxCount);
  const isTied = tiedVotes.length > 1;

  return (
    <div className="summary-modal-overlay" onClick={onClose}>
      <div
        className="summary-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="summary-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        <h3 className="summary-title">📊 Resumen de Votaciones</h3>
        <div className="summary-stats">
          {hasNoVotes ? (
            <p className="no-votes">No hay votos registrados</p>
          ) : (
            <>
              <div className="votes-grid">
                {sortedVotes.map(({ vote, count, percentage }, index) => {
                  const isWinner = index === 0 && !isTied;

                  return (
                    <div
                      key={vote}
                      className={`vote-item ${index === 0 ? "most-voted" : ""}`}
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
                        <div className="most-voted-badge">🏆 Más votada</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="total-votes">
                Total de votos: <strong>{totalVotes}</strong>
              </div>
            </>
          )}
        </div>
        <div className="summary-modal-actions">
          <button className="summary-modal-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
