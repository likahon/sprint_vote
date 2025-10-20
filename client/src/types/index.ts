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

export const VOTE_OPTIONS = [
  { value: '1', label: '1' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '8', label: '8' },
  { value: '13', label: '13' }
];

