export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3001,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  SOCKET_CORS_ORIGIN: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
  GLOBAL_ROOM_ID: 'global-room',
} as const;

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  USER_JOIN: 'user-join',
  USER_JOINED: 'user-joined',
  USER_VOTE: 'user-vote',
  USER_VOTED: 'user-voted',
  REVEAL_VOTES: 'reveal-votes',
  VOTES_REVEALED: 'votes-revealed',
  RESET_VOTES: 'reset-votes',
  VOTES_RESET: 'votes-reset',
  SEND_EMOJI: 'send-emoji',
  EMOJI_FLYING: 'emoji-flying',
  EMOJI_RECEIVED: 'emoji-received',
  ROOM_UPDATE: 'room-update',
  TOGGLE_ALLOW_VOTE_CHANGE: 'toggle-allow-vote-change',
  ERROR: 'error',
} as const;

