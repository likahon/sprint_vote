import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, User } from '../types';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Conectar al servidor de desarrollo
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3001';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('room-update', (roomData: Room) => {
      console.log('Received room-update:', roomData);
      setRoom(roomData);
      
      // Update currentUser if it exists and its data changed in the room
      setCurrentUser(prevUser => {
        if (prevUser) {
          const updatedUser = roomData.users.find(u => u.id === prevUser.id);
          if (updatedUser) {
            console.log('Updating currentUser:', updatedUser);
            return updatedUser;
          }
        }
        return prevUser;
      });
    });

    newSocket.on('user-joined', (user: User) => {
      setCurrentUser(user);
    });

    newSocket.on('user-voted', (userId: string) => {
      console.log('Usuario votó:', userId);
    });

    newSocket.on('votes-revealed', (roomData: Room) => {
      console.log('Received votes-revealed event:', roomData);
      setRoom(roomData);
    });

    newSocket.on('votes-reset', (roomData: Room) => {
      console.log('Received votes-reset event:', roomData);
      setRoom(roomData);
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (name: string) => {
    if (socket) {
      socket.emit('user-join', { name });
    }
  };

  const vote = (userId: string, vote: string) => {
    if (socket) {
      socket.emit('user-vote', { userId, vote });
    }
  };

  const revealVotes = () => {
    if (socket) {
      console.log('Emitting reveal-votes event');
      socket.emit('reveal-votes');
    } else {
      console.error('Socket not connected');
    }
  };

  const resetVotes = () => {
    if (socket) {
      socket.emit('reset-votes');
    }
  };

  return {
    socket,
    room,
    currentUser,
    error,
    joinRoom,
    vote,
    revealVotes,
    resetVotes,
    setCurrentUser,
    setError
  };
};
