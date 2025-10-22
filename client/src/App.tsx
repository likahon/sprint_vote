import { useState, useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import { LoginScreen } from "./components/LoginScreen";
import { GameTable } from "./components/GameTable";
import { Chat } from "./components/Chat";
import { UserManagementModal } from "./components/UserManagementModal";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Header } from "./components/Header";
import { UserRole } from "./types";
import "./App.css";

function App() {
  const socketData = useSocket();
  const {
    room,
    currentUser,
    error,
    messages,
    joinRoom,
    sendChatMessage,
    setCurrentUser,
    setError,
  } = socketData;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogin = (name: string) => {
    joinRoom(name);
    setIsLoggedIn(true);
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleUsers = () => {
    setShowUsersModal(true);
  };

  const handleChangeRole = (userId: string, role: UserRole) => {
    if (socketData.socket) {
      socketData.socket.emit("change-user-role", { userId, role });
    }
  };

  useEffect(() => {
    if (room && !currentUser) {
      const user = room.users.find((u) => u.socketId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [room, currentUser, setCurrentUser]);

  if (error) {
    return (
      <>
        <Header showLeaveButton={false} />
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoggedIn(false);
              window.location.reload();
            }}
          >
            Volver al inicio
          </button>
        </div>
      </>
    );
  }

  const handleLeave = () => {
    window.location.reload();
  };

  if (!isLoggedIn) {
    return (
      <>
        <Header showLeaveButton={false} />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  if (!room || !currentUser) {
    return (
      <>
        <Header showLeaveButton={false} />
        <div className="loading">
          <p>Conectando a la mesa...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        showLeaveButton={true}
        onLeave={handleLeave}
        onSettings={handleSettings}
        showSettings={currentUser.isAdmin}
        onUsers={handleUsers}
        showUsers={currentUser.isAdmin}
      />
      <GameTable
        room={room}
        currentUser={currentUser}
        socketData={socketData}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
      />
      <UserManagementModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        users={room.users}
        currentUserId={currentUser.id}
        onChangeRole={handleChangeRole}
      />
      <Chat
        messages={messages}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
        onSendMessage={sendChatMessage}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </>
  );
}

export default function AppWrapper() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
