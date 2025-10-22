import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, User, EmojiReaction, SERVER_CONFIG } from '../types';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(SERVER_CONFIG.LOCAL_URL, {
      reconnectionAttempts: SERVER_CONFIG.RECONNECTION_ATTEMPTS,
      reconnectionDelay: SERVER_CONFIG.RECONNECTION_DELAY,
    });
    setSocket(newSocket);

    newSocket.on('room-update', (roomData: Room) => {
      setRoom(roomData);
      
      setCurrentUser(prevUser => {
        if (prevUser) {
          const updatedUser = roomData.users.find(u => u.id === prevUser.id);
          if (updatedUser) {
            return updatedUser;
          }
        }
        return prevUser;
      });
    });

    newSocket.on('user-joined', (user: User) => {
      setCurrentUser(user);
    });

    newSocket.on('votes-revealed', (roomData: Room) => {
      setRoom(roomData);
    });

    newSocket.on('votes-reset', (roomData: Room) => {
      setRoom(roomData);
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    newSocket.on('emoji-received', (data: { emoji: EmojiReaction }) => {
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
      socket.emit('reveal-votes');
    }
  };

  const resetVotes = () => {
    if (socket) {
      socket.emit('reset-votes');
    }
  };

  const sendEmoji = (toUserId: string, emoji: string, fromLeftSide: boolean, fromUser?: User) => {
    let user = fromUser || currentUser;
    
    if (!user && socket && (socket as any).auth?.userId && room) {
      user = room.users.find(u => u.id === (socket as any).auth?.userId) || null;
    }
    
    if (!user && socket && socket.id && room) {
      user = room.users.find(u => u.socketId === socket.id) || null;
    }
    
    if (socket && user) {
      const emojiReaction: EmojiReaction = {
        id: `${Date.now()}-${Math.random()}`,
        emoji,
        fromUserId: user.id,
        fromUserName: user.name,
        toUserId,
        timestamp: Date.now()
      };
      
      const emojiData = {
        ...emojiReaction,
        fromLeftSide
      };
      
      socket.emit('send-emoji', emojiData);
    }
  };

  const toggleAllowVoteChange = (allow: boolean) => {
    if (socket) {
      socket.emit('toggle-allow-vote-change', { allow });
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
    toggleAllowVoteChange,
    setCurrentUser,
    setError
  };
};
