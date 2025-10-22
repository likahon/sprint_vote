import React from "react";
import { User, UserRole, ANIMATION_CONFIG } from "../types";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  onChangeRole: (userId: string, role: UserRole) => void;
}

const AVAILABLE_ROLES: UserRole[] = [
  "Admin",
  "Co Admin",
  "Dev",
  "Product Owner",
  "Observer",
];

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Admin: "Vota, revela, reinicia y cambia roles",
  "Co Admin": "Vota, revela y reinicia votaciones",
  Dev: "Vota y participa en estimaciones",
  "Product Owner": "NO vota, solo observa y define historias",
  Observer: "NO vota, solo observa las votaciones",
};

const ROLE_ICONS: Record<UserRole, string> = {
  Admin: "👑",
  "Co Admin": "⚙️",
  Dev: "💻",
  "Product Owner": "📋",
  Observer: "👁️",
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onChangeRole,
}) => {
  if (!isOpen) return null;

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    onChangeRole(userId, newRole);
  };

  return (
    <div
      className="summary-modal-overlay"
      onClick={onClose}
      style={{ zIndex: ANIMATION_CONFIG.MODAL_Z_INDEX }}
    >
      <div
        className="summary-modal-content user-management-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="summary-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="user-management-title">👥 Gestión de Usuarios</h2>

        <div className="user-management-list">
          {users.map((user) => (
            <div key={user.id} className="user-management-item">
              <div className="user-management-info">
                <div className="user-management-name">
                  <span className="user-role-icon">
                    {ROLE_ICONS[user.role]}
                  </span>
                  <span className="user-name-text">
                    {user.name}
                    {user.id === currentUserId && (
                      <span className="user-badge-self"> (Tú)</span>
                    )}
                  </span>
                </div>
                <div className="user-management-role-description">
                  {ROLE_DESCRIPTIONS[user.role]}
                </div>
              </div>

              <div className="user-management-role-selector">
                <label
                  htmlFor={`role-${user.id}`}
                  className="role-selector-label"
                >
                  Rol:
                </label>
                <select
                  id={`role-${user.id}`}
                  value={user.role}
                  onChange={(e) =>
                    handleRoleChange(user.id, e.target.value as UserRole)
                  }
                  className="role-selector-dropdown"
                  disabled={user.id === currentUserId}
                >
                  {AVAILABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_ICONS[role]} {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="user-management-info-box">
          <h4>ℹ️ Información sobre roles:</h4>
          <ul>
            <li>
              <strong>Admin:</strong> Vota y tiene control total de la sala
            </li>
            <li>
              <strong>Co Admin:</strong> Vota y gestiona votaciones
            </li>
            <li>
              <strong>Dev:</strong> Vota y participa en estimaciones
            </li>
            <li>
              <strong>Product Owner:</strong> NO vota, solo observa
            </li>
            <li>
              <strong>Observer:</strong> NO vota, solo observa
            </li>
          </ul>
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
