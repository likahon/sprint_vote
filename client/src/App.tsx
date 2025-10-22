import { useState, useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import { LoginScreen } from "./components/LoginScreen";
import { GameTable } from "./components/GameTable";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Header } from "./components/Header";
import "./App.css";

function App() {
  const socketData = useSocket();
  const { room, currentUser, error, joinRoom, setCurrentUser, setError } =
    socketData;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (name: string) => {
    joinRoom(name);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (room && !currentUser) {
      // Buscar el usuario actual en la sala
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
      <Header showLeaveButton={true} onLeave={handleLeave} />
      <GameTable
        room={room}
        currentUser={currentUser}
        socketData={socketData}
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
