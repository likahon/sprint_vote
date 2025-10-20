import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { User, Room, EmojiReaction } from './types';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// In-memory storage (no database needed)
const users: Map<string, User> = new Map();
const room: Room = {
  id: 'global-room',
  users: [],
  votesRevealed: false,
  adminId: undefined
};

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('user-join', async (data: { name: string }) => {
    try {
      const { name } = data;
      const isAdmin = name.endsWith('_admin');
      const displayName = isAdmin ? name.replace('_admin', '') : name;

      // Check if user already exists with this name
      const existingUser = room.users.find(u => u.name === displayName);
      
      if (existingUser) {
        // Update existing user's socket ID
        existingUser.socketId = socket.id;
        users.set(socket.id, existingUser);
        console.log('Updated existing user socket:', existingUser.name, 'socket:', socket.id);
      } else {
        // Create new user
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
        console.log('Created new user:', user.name, 'socket:', socket.id);
      }

      // Set admin if this is the first admin
      if (isAdmin && !room.adminId) {
        const currentUser = existingUser || room.users[room.users.length - 1];
        room.adminId = currentUser.id;
      }

      // Join socket to room
      socket.join(room.id);

      // Get the current user (either existing or new)
      const currentUser = existingUser || room.users[room.users.length - 1];
      
      // Emit user joined event
      socket.emit('user-joined', currentUser);

      // Broadcast room update to all users
      io.to(room.id).emit('room-update', room);

    } catch (error) {
      console.error('Error in user-join:', error);
      socket.emit('error', { message: 'Error al unirse a la sala' });
    }
  });

  socket.on('user-vote', async (data: { userId: string; vote: string }) => {
    try {
      console.log('Received user-vote event:', data);
      const { userId, vote } = data;
      
      const user = room.users.find(u => u.id === userId);
      if (!user) {
        console.log('User not found for vote');
        socket.emit('error', { message: 'Usuario no encontrado' });
        return;
      }

      console.log('User found, updating vote:', user.name, 'vote:', vote);
      user.hasVoted = true;
      user.vote = vote;

      // Broadcast vote to all users
      socket.to(room.id).emit('user-voted', userId);

      // Update room
      console.log('Broadcasting room update:', room);
      io.to(room.id).emit('room-update', room);

    } catch (error) {
      console.error('Error in user-vote:', error);
      socket.emit('error', { message: 'Error al votar' });
    }
  });

  socket.on('reveal-votes', async () => {
    try {
      console.log('Received reveal-votes event from socket:', socket.id);
      
      // Check if there's an admin in the room
      const adminUser = room.users.find(u => u.isAdmin);
      if (!adminUser) {
        console.log('No admin found in room');
        socket.emit('error', { message: 'No hay administrador en la sala' });
        return;
      }

      console.log('Admin found:', adminUser.name, 'Revealing votes...');
      room.votesRevealed = true;

      // Broadcast to all users
      io.to(room.id).emit('votes-revealed', room);
      io.to(room.id).emit('room-update', room);
      console.log('Votes revealed and broadcasted');

    } catch (error) {
      console.error('Error in reveal-votes:', error);
      socket.emit('error', { message: 'Error al revelar votos' });
    }
  });

  socket.on('reset-votes', async () => {
    try {
      // Check if there's an admin in the room
      const adminUser = room.users.find(u => u.isAdmin);
      if (!adminUser) {
        socket.emit('error', { message: 'No hay administrador en la sala' });
        return;
      }

      // Reset all users' votes
      room.users.forEach(user => {
        user.hasVoted = false;
        user.vote = undefined;
      });

      room.votesRevealed = false;

      // Broadcast to all users
      io.to(room.id).emit('votes-reset', room);
      io.to(room.id).emit('room-update', room);

    } catch (error) {
      console.error('Error in reset-votes:', error);
      socket.emit('error', { message: 'Error al resetear votos' });
    }
  });

  socket.on('send-emoji', async (emoji: EmojiReaction) => {
    try {
      console.log('Received emoji:', emoji);
      
      // Verificar que el usuario que envía el emoji existe
      const fromUser = room.users.find(u => u.socketId === socket.id);
      if (!fromUser) {
        socket.emit('error', { message: 'Usuario no encontrado' });
        return;
      }

      // Verificar que el usuario destinatario existe
      const toUser = room.users.find(u => u.id === emoji.toUserId);
      if (!toUser) {
        socket.emit('error', { message: 'Usuario destinatario no encontrado' });
        return;
      }

      // Agregar el emoji al usuario destinatario
      if (!toUser.emojis) {
        toUser.emojis = [];
      }
      toUser.emojis.push(emoji);

      // Broadcast el emoji a todos los usuarios
      io.to(room.id).emit('emoji-received', { emoji });

      // Actualizar la sala
      io.to(room.id).emit('room-update', room);

    } catch (error) {
      console.error('Error in send-emoji:', error);
      socket.emit('error', { message: 'Error al enviar emoji' });
    }
  });

  socket.on('disconnect', async () => {
    try {
      console.log('Usuario desconectado:', socket.id);
      
      // Remove user from room
      const user = room.users.find(u => u.socketId === socket.id);
      if (user) {
        room.users = room.users.filter(u => u.id !== user.id);
        users.delete(socket.id);
      }

      // Broadcast room update
      io.to(room.id).emit('room-update', room);

    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log('Usando almacenamiento en memoria (sin base de datos)');
});
