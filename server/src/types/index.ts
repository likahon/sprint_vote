export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
  hasVoted: boolean;
  vote?: string;
  socketId?: string;
  roomId?: string;
}

export interface Room {
  id: string;
  users: User[];
  votesRevealed: boolean;
  adminId?: string;
}

export interface SocketEvents {
  'user-join': (data: { name: string }) => void;
  'user-vote': (data: { userId: string; vote: string }) => void;
  'reveal-votes': () => void;
  'reset-votes': () => void;
  'room-update': (room: Room) => void;
  'user-joined': (user: User) => void;
  'user-voted': (userId: string) => void;
  'votes-revealed': (room: Room) => void;
  'votes-reset': (room: Room) => void;
  'error': (data: { message: string }) => void;
}

