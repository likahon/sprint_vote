import { useState, useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import { LoginScreen } from "./components/LoginScreen";
import { GameTable } from "./components/GameTable";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import "./App.css";

function App() {
  const { room, currentUser, error, joinRoom, setCurrentUser, setError } =
    useSocket();
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
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => setError(null)}>Cerrar</button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!room || !currentUser) {
    return (
      <div className="loading">
        <p>Conectando a la mesa...</p>
      </div>
    );
  }

  return (
    <>
      <ThemeToggle />
      <GameTable room={room} currentUser={currentUser} />
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
