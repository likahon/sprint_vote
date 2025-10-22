export const ANIMATION_CONFIG = {
  DEBOUNCE_TIME: 300,
  EMOJI_FLIGHT_DURATION: 1500,
  CARD_BOUNCE_DURATION: 600,
  MODAL_Z_INDEX: 3000,
  EMOJI_Z_INDEX: 2000,
  EMOJI_INITIAL_SPEED: 25,
  EMOJI_GRAVITY: 0.2,
  EMOJI_BOUNCE_DAMPING: 0.7,
  EMOJI_FRICTION: 0.95,
} as const;

export const VOTE_OPTIONS = [
  { value: '1', label: '1' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '8', label: '8' },
  { value: '13', label: '13' }
] as const;

export const UI_CONFIG = {
  CARD_WIDTH: 150,
  CARD_HEIGHT: 220,
  CARD_MIN_HEIGHT: 100,
  EMOJI_ORIGIN_OFFSET: 20,
} as const;

export const SERVER_CONFIG = {
  LOCAL_URL: 'http://localhost:3001',
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
} as const;

