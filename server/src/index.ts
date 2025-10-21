import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { User, IUser } from './models/User';
import { Room, IRoom } from './models/Room';
import { User as UserType, Room as RoomType, EmojiReaction } from './types';

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

// MongoDB connection - Using MongoDB Atlas or local fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://demo:demo123@cluster0.mongodb.net/planning-poker?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    console.log('Continuando sin base de datos...');
  });

// Global room (single room for simplicity)
const GLOBAL_ROOM_ID = 'global-room';

// Helper function to convert IUser to User
const convertUser = (user: IUser): UserType => ({
  id: user.id,
  name: user.name,
  isAdmin: user.isAdmin,
  hasVoted: user.hasVoted,
  vote: user.vote,
  socketId: user.socketId,
  roomId: user.roomId
});

// Helper function to get room with users
const getRoomWithUsers = async (): Promise<RoomType | null> => {
  try {
    const room = await Room.findOne({ id: GLOBAL_ROOM_ID }).populate('users');
    if (!room) return null;

    const users = (room.users as any[]).map((user: any) => convertUser(user as IUser));
    return {
      id: room.id,
      users,
      votesRevealed: room.votesRevealed,
      adminId: room.adminId
    };
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
};

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('user-join', async (data: { name: string }) => {
    try {
      const { name } = data;
      const wantsToBeAdmin = name.endsWith('_admin');
      const displayName = wantsToBeAdmin ? name.replace('_admin', '') : name;

      console.log(`🔍 User trying to join: ${displayName} ${wantsToBeAdmin ? '(wants admin)' : '(regular user)'} - Socket: ${socket.id}`);

      // Check if user already exists with this socket
      const existingUser = await User.findOne({ socketId: socket.id });

      // VALIDACIÓN CRÍTICA: Verificar si ya existe un admin ANTES de hacer cualquier cosa
      if (wantsToBeAdmin) {
        // Buscar todos los usuarios admin en la sala
        const allAdmins = await User.find({ 
          roomId: GLOBAL_ROOM_ID, 
          isAdmin: true 
        });

        console.log(`👑 Current admins in room: ${allAdmins.length}`, allAdmins.map(a => `${a.name} (${a.id})`));

        // Permitir SOLO si:
        // 1. No hay admins en la sala, O
        // 2. El usuario existente YA es el admin (está reconectando)
        const isReconnectingAdmin = existingUser && existingUser.isAdmin && allAdmins.length === 1 && allAdmins[0].id === existingUser.id;
        
        if (allAdmins.length > 0 && !isReconnectingAdmin) {
          console.log(`❌ REJECTING ADMIN REQUEST - Admin already exists: ${allAdmins[0].name}`);
          socket.emit('error', { 
            message: `Ya existe un administrador en la sala (${allAdmins[0].name}). Solo puede haber un administrador.` 
          });
          socket.disconnect(true);
          return;
        }

        console.log(`✅ Admin request approved ${isReconnectingAdmin ? '(reconnecting)' : '(new admin)'}`);
      }

      let user: any;
      
      if (existingUser) {
        // Update existing user
        console.log(`🔄 Updating existing user: ${existingUser.name} -> ${displayName}`);
        existingUser.name = displayName;
        existingUser.isAdmin = wantsToBeAdmin;
        existingUser.socketId = socket.id;
        existingUser.roomId = GLOBAL_ROOM_ID;
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user
        console.log(`➕ Creating new user: ${displayName}`);
        user = new User({
          id: uuidv4(),
          name: displayName,
          isAdmin: wantsToBeAdmin,
          hasVoted: false,
          socketId: socket.id,
          roomId: GLOBAL_ROOM_ID
        });
        await user.save();
      }

      // VERIFICACIÓN FINAL DE SEGURIDAD: Asegurar que solo hay un admin
      if (wantsToBeAdmin) {
        const finalAdminCheck = await User.countDocuments({ 
          roomId: GLOBAL_ROOM_ID, 
          isAdmin: true 
        });
        
        if (finalAdminCheck > 1) {
          console.log(`🚨 CRITICAL: Multiple admins detected! Removing latest admin`);
          await User.deleteOne({ id: user.id });
          socket.emit('error', { 
            message: 'Error de sincronización. Por favor intenta nuevamente.' 
          });
          socket.disconnect(true);
          return;
        }
      }

      // Ensure global room exists
      let room = await Room.findOne({ id: GLOBAL_ROOM_ID });
      if (!room) {
        room = new Room({
          id: GLOBAL_ROOM_ID,
          users: [],
          votesRevealed: false
        });
      }

      // Add user to room if not already there
      if (!room.users.some(userId => userId.toString() === (user._id as any).toString())) {
        room.users.push(user._id as any);
      }

      // Set admin if this is the first admin
      if (wantsToBeAdmin && !room.adminId) {
        room.adminId = user.id;
      }

      await room.save();

      // Join socket to room
      socket.join(GLOBAL_ROOM_ID);

      console.log(`✅ User joined successfully: ${displayName} ${wantsToBeAdmin ? '(Admin)' : '(User)'}`);

      // Emit user joined event
      socket.emit('user-joined', convertUser(user));

      // Broadcast room update to all users
      const roomWithUsers = await getRoomWithUsers();
      if (roomWithUsers) {
        io.to(GLOBAL_ROOM_ID).emit('room-update', roomWithUsers);
      }

    } catch (error) {
      console.error('Error in user-join:', error);
      socket.emit('error', { message: 'Error al unirse a la sala' });
    }
  });

  socket.on('user-vote', async (data: { userId: string; vote: string }) => {
    try {
      const { userId, vote } = data;
      
      const user = await User.findOne({ id: userId });
      if (!user) {
        socket.emit('error', { message: 'Usuario no encontrado' });
        return;
      }

      user.hasVoted = true;
      user.vote = vote;
      await user.save();

      // Broadcast vote to all users
      socket.to(GLOBAL_ROOM_ID).emit('user-voted', userId);

      // Update room
      const roomWithUsers = await getRoomWithUsers();
      if (roomWithUsers) {
        io.to(GLOBAL_ROOM_ID).emit('room-update', roomWithUsers);
      }

    } catch (error) {
      console.error('Error in user-vote:', error);
      socket.emit('error', { message: 'Error al votar' });
    }
  });

  socket.on('reveal-votes', async () => {
    try {
      const room = await Room.findOne({ id: GLOBAL_ROOM_ID });
      if (!room) {
        socket.emit('error', { message: 'Sala no encontrada' });
        return;
      }

      // Check if user is admin
      const user = await User.findOne({ socketId: socket.id });
      if (!user || !user.isAdmin) {
        socket.emit('error', { message: 'Solo el administrador puede revelar votos' });
        return;
      }

      room.votesRevealed = true;
      await room.save();

      // Broadcast to all users
      const roomWithUsers = await getRoomWithUsers();
      if (roomWithUsers) {
        io.to(GLOBAL_ROOM_ID).emit('votes-revealed', roomWithUsers);
        io.to(GLOBAL_ROOM_ID).emit('room-update', roomWithUsers);
      }

    } catch (error) {
      console.error('Error in reveal-votes:', error);
      socket.emit('error', { message: 'Error al revelar votos' });
    }
  });

  socket.on('reset-votes', async () => {
    try {
      const room = await Room.findOne({ id: GLOBAL_ROOM_ID });
      if (!room) {
        socket.emit('error', { message: 'Sala no encontrada' });
        return;
      }

      // Check if user is admin
      const user = await User.findOne({ socketId: socket.id });
      if (!user || !user.isAdmin) {
        socket.emit('error', { message: 'Solo el administrador puede resetear votos' });
        return;
      }

      // Reset all users' votes
      await User.updateMany(
        { roomId: GLOBAL_ROOM_ID },
        { hasVoted: false, vote: undefined }
      );

      room.votesRevealed = false;
      await room.save();

      // Broadcast to all users
      const roomWithUsers = await getRoomWithUsers();
      if (roomWithUsers) {
        io.to(GLOBAL_ROOM_ID).emit('votes-reset', roomWithUsers);
        io.to(GLOBAL_ROOM_ID).emit('room-update', roomWithUsers);
      }

    } catch (error) {
      console.error('Error in reset-votes:', error);
      socket.emit('error', { message: 'Error al resetear votos' });
    }
  });

  socket.on('send-emoji', async (data: EmojiReaction & { fromPosition?: { x: number; y: number }; toPosition?: { x: number; y: number } }) => {
    try {
      console.log('Received emoji:', data);
      
      // Verificar que el usuario que envía el emoji existe
      const fromUser = await User.findOne({ socketId: socket.id });
      if (!fromUser) {
        socket.emit('error', { message: 'Usuario no encontrado' });
        return;
      }

      // Verificar que el usuario destinatario existe
      const toUser = await User.findOne({ id: data.toUserId });
      if (!toUser) {
        socket.emit('error', { message: 'Usuario destinatario no encontrado' });
        return;
      }

      // Agregar el emoji al usuario destinatario
      if (!toUser.emojis) {
        toUser.emojis = [];
      }
      toUser.emojis.push(data);
      await toUser.save();

      // Broadcast el emoji con animación a todos los usuarios
      const flyingEmojiData = {
        emoji: data.emoji,
        fromPosition: data.fromPosition,
        toPosition: data.toPosition,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        toUserId: data.toUserId,
        id: data.id
      };
      
      console.log('🎯 Broadcasting emoji-flying to all users:', flyingEmojiData);
      io.to(GLOBAL_ROOM_ID).emit('emoji-flying', flyingEmojiData);

      // También enviar el evento original para compatibilidad
      io.to(GLOBAL_ROOM_ID).emit('emoji-received', { emoji: data });

      // Actualizar la sala
      const roomWithUsers = await getRoomWithUsers();
      if (roomWithUsers) {
        io.to(GLOBAL_ROOM_ID).emit('room-update', roomWithUsers);
      }

    } catch (error) {
      console.error('Error in send-emoji:', error);
      socket.emit('error', { message: 'Error al enviar emoji' });
    }
  });

  socket.on('disconnect', async () => {
    try {
      console.log('Usuario desconectado:', socket.id);
      
      // Remove user from room
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        console.log(`👋 User leaving: ${user.name} ${user.isAdmin ? '(Admin)' : '(User)'}`);
        
        const room = await Room.findOne({ id: GLOBAL_ROOM_ID });
        if (room) {
          room.users = room.users.filter((userId: any) => userId.toString() !== (user._id as any).toString());
          
          // If the disconnecting user was admin, clear the adminId
          if (user.isAdmin && room.adminId === user.id) {
            room.adminId = undefined;
            console.log('👑 Admin left - admin slot is now available');
          }
          
          await room.save();
        }
        
        await User.deleteOne({ socketId: socket.id });
        console.log(`✅ User ${user.name} removed from database`);
      }

      // Broadcast room update
      const roomWithUsers = await getRoomWithUsers();
      if (roomWithUsers) {
        io.to(GLOBAL_ROOM_ID).emit('room-update', roomWithUsers);
      }

    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
