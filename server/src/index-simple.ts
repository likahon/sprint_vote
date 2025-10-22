import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { User, Room, EmojiReaction } from './types';
import dotenv from 'dotenv';
import { SERVER_CONFIG, SOCKET_EVENTS } from './config/constants';
import { emitRoomUpdate, handleError } from './utils/socketHelpers';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: SERVER_CONFIG.SOCKET_CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

const users: Map<string, User> = new Map();
const room: Room = {
  id: SERVER_CONFIG.GLOBAL_ROOM_ID,
  users: [],
  votesRevealed: false,
  adminId: undefined
};

io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {

  socket.on(SOCKET_EVENTS.USER_JOIN, async (data: { name: string }) => {
    try {
      const { name } = data;
      const isAdmin = name.endsWith('_admin');
      const displayName = isAdmin ? name.replace('_admin', '') : name;

      const existingUser = room.users.find(u => u.name === displayName);
      
      if (existingUser) {
        existingUser.socketId = socket.id;
        users.set(socket.id, existingUser);
      } else {
        const user: User = {
          id: uuidv4(),
          name: displayName,
          isAdmin,
          hasVoted: false,
          socketId: socket.id,
          roomId: room.id,
          emojis: []
        };

        users.set(socket.id, user);
        room.users.push(user);
      }

      if (isAdmin && !room.adminId) {
        const currentUser = existingUser || room.users[room.users.length - 1];
        room.adminId = currentUser.id;
      }

      socket.join(room.id);

      const currentUser = existingUser || room.users[room.users.length - 1];
      
      socket.emit(SOCKET_EVENTS.USER_JOINED, currentUser);
      emitRoomUpdate(io, room, true);

    } catch (error) {
      handleError(socket, 'Error al unirse a la sala', error);
    }
  });

  socket.on(SOCKET_EVENTS.USER_VOTE, async (data: { userId: string; vote: string }) => {
    try {
      const { userId, vote } = data;
      
      const user = room.users.find(u => u.id === userId);
      if (!user) {
        handleError(socket, 'Usuario no encontrado');
        return;
      }

      if (!room.allowVoteChange && user.hasVoted) {
        handleError(socket, 'Ya has votado. El admin debe habilitar "Desbloquear votos" para cambiar tu voto.');
        return;
      }

      user.hasVoted = true;
      user.vote = vote;

      socket.to(room.id).emit(SOCKET_EVENTS.USER_VOTED, userId);
      emitRoomUpdate(io, room);

    } catch (error) {
      handleError(socket, 'Error al votar', error);
    }
  });

  socket.on(SOCKET_EVENTS.REVEAL_VOTES, async () => {
    try {
      const adminUser = room.users.find(u => u.isAdmin);
      if (!adminUser) {
        handleError(socket, 'No hay administrador en la sala');
        return;
      }

      room.votesRevealed = true;

      io.to(room.id).emit(SOCKET_EVENTS.VOTES_REVEALED, room);
      emitRoomUpdate(io, room, true);

    } catch (error) {
      handleError(socket, 'Error al revelar votos', error);
    }
  });

  socket.on(SOCKET_EVENTS.RESET_VOTES, async () => {
    try {
      const adminUser = room.users.find(u => u.isAdmin);
      if (!adminUser) {
        handleError(socket, 'No hay administrador en la sala');
        return;
      }

      room.users.forEach(user => {
        user.hasVoted = false;
        user.vote = undefined;
      });

      room.votesRevealed = false;

      io.to(room.id).emit(SOCKET_EVENTS.VOTES_RESET, room);
      emitRoomUpdate(io, room, true);

    } catch (error) {
      handleError(socket, 'Error al resetear votos', error);
    }
  });

  socket.on(SOCKET_EVENTS.TOGGLE_ALLOW_VOTE_CHANGE, (data: { allow: boolean }) => {
    try {
      const user = room.users.find(u => u.socketId === socket.id);
      if (!user || !user.isAdmin) {
        handleError(socket, 'Solo el admin puede cambiar esta configuración');
        return;
      }

      room.allowVoteChange = data.allow;
      emitRoomUpdate(io, room, true);

    } catch (error) {
      handleError(socket, 'Error al cambiar configuración', error);
    }
  });

  socket.on(SOCKET_EVENTS.SEND_EMOJI, (data: any) => {
    try {
      const fromUser = room.users.find(u => u.id === data.fromUserId);
      
      if (!fromUser) {
        handleError(socket, 'Usuario no encontrado');
        return;
      }

      const toUser = room.users.find(u => u.id === data.toUserId);
      
      if (!toUser) {
        handleError(socket, 'Usuario destinatario no encontrado');
        return;
      }

      if (!toUser.emojis) {
        toUser.emojis = [];
      }
      const emojiReaction: EmojiReaction = {
        id: data.id,
        emoji: data.emoji,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        toUserId: data.toUserId,
        timestamp: data.timestamp
      };
      toUser.emojis.push(emojiReaction);

      const flyingEmojiData = {
        emoji: data.emoji,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        toUserId: data.toUserId,
        id: data.id,
        fromLeftSide: data.fromLeftSide
      };
      
      io.to(room.id).emit(SOCKET_EVENTS.EMOJI_FLYING, flyingEmojiData);
      io.to(room.id).emit(SOCKET_EVENTS.EMOJI_RECEIVED, { emoji: emojiReaction });
      emitRoomUpdate(io, room);

    } catch (error) {
      handleError(socket, 'Error al enviar emoji', error);
    }
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
    try {
      const user = room.users.find(u => u.socketId === socket.id);
      if (user) {
        room.users = room.users.filter(u => u.id !== user.id);
        users.delete(socket.id);
      }

      emitRoomUpdate(io, room, true);

    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${SERVER_CONFIG.PORT}`);
});
