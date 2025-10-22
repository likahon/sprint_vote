import React from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowVoteChange: boolean;
  onToggleAllowVoteChange: (allow: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  allowVoteChange,
  onToggleAllowVoteChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="summary-modal-overlay" onClick={onClose}>
      <div
        className="summary-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px" }}
      >
        <button
          className="summary-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>
          ⚙️ Settings
        </h2>

        <div style={{ padding: "1rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              cursor: "pointer",
              padding: "1rem",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              transition: "all 0.3s ease",
            }}
          >
            <input
              type="checkbox"
              checked={allowVoteChange}
              onChange={(e) => onToggleAllowVoteChange(e.target.checked)}
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
              }}
            />
            <div>
              <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                Desbloquear votos
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                }}
              >
                Permite a todos los usuarios cambiar su voto después de haberlo
                seleccionado
              </div>
            </div>
          </label>
        </div>

        <div className="summary-modal-actions" style={{ marginTop: "2rem" }}>
          <button className="summary-modal-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
