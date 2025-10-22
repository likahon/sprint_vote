import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, User, EmojiReaction } from '../types';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Conectar al servidor de desarrollo
    const serverUrl = 'http://localhost:3001';
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

    newSocket.on('emoji-received', (data: { emoji: EmojiReaction }) => {
      console.log('Received emoji:', data.emoji);
      // Actualizar la sala con el nuevo emoji
      setRoom(prevRoom => {
        if (!prevRoom) return prevRoom;
        
        const updatedUsers = prevRoom.users.map(user => {
          if (user.id === data.emoji.toUserId) {
            return {
              ...user,
              emojis: [...(user.emojis || []), data.emoji]
            };
          }
          return user;
        });
        
        return {
          ...prevRoom,
          users: updatedUsers
        };
      });
    });

    // Eliminado: el evento emoji-flying se maneja en GameTable.tsx

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

  const sendEmoji = (toUserId: string, emoji: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }, fromUser?: User) => {
    console.log('🔍 sendEmoji called with:', {
      toUserId,
      emoji,
      fromUserProvided: !!fromUser,
      currentUserInHook: !!currentUser,
      socketExists: !!socket
    });
    
    // Intentar obtener el usuario de múltiples fuentes
    let user = fromUser || currentUser;
    
    // Si aún no hay usuario, intentar obtenerlo del socket
    if (!user && socket && (socket as any).auth?.userId && room) {
      user = room.users.find(u => u.id === (socket as any).auth?.userId);
      console.log('🔍 Found user from socket auth:', user);
    }
    
    // Si aún no hay usuario, usar el ID del socket
    if (!user && socket && socket.id && room) {
      user = room.users.find(u => u.socketId === socket.id);
      console.log('🔍 Found user from socket ID:', user);
    }
    
    if (socket && user) {
      const emojiReaction: EmojiReaction = {
        id: Date.now().toString(),
        emoji,
        fromUserId: user.id,
        fromUserName: user.name,
        toUserId,
        timestamp: Date.now()
      };
      
      const emojiData = {
        ...emojiReaction,
        fromPosition,
        toPosition
      };
      
      console.log('🔥 CLIENT: Emitting send-emoji event to server:', emojiData);
      console.log('🔥 CLIENT: Socket connected?', socket.connected);
      console.log('🔥 CLIENT: Socket ID:', socket.id);
      
      // Enviar el emoji con las posiciones para la animación
      socket.emit('send-emoji', emojiData);
    } else {
      console.error('❌ Cannot send emoji - socket or currentUser is null', {
        socket: !!socket,
        currentUser: !!user,
        fromUserProvided: !!fromUser,
        roomExists: !!room,
        socketId: socket?.id
      });
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
    sendEmoji,
    setCurrentUser,
    setError
  };
};
