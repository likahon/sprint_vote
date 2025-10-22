import { Server } from 'socket.io';
import { Room } from '../types';
import { SOCKET_EVENTS } from '../config/constants';

let lastRoomUpdate: string | null = null;
let updateTimeout: NodeJS.Timeout | null = null;

export const emitRoomUpdate = (io: Server, room: Room, immediate: boolean = false) => {
  const currentRoomState = JSON.stringify(room);
  
  if (immediate) {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
    lastRoomUpdate = currentRoomState;
    io.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, room);
    return;
  }

  if (lastRoomUpdate === currentRoomState) {
    return;
  }

  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(() => {
    lastRoomUpdate = currentRoomState;
    io.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, room);
    updateTimeout = null;
  }, 50);
};

export const handleError = (socket: any, message: string, error?: any) => {
  if (error) {
    console.error(message, error);
  }
  socket.emit(SOCKET_EVENTS.ERROR, { message });
};

