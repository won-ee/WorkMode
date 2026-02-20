// 상수 정의

export interface WorkModeState {
  enabled: boolean;
  hideImages: boolean;
  hideVideos: boolean;
  hideEmojis: boolean;
  hideTab: boolean;
  theme: 'erp' | 'spreadsheet' | 'email' | 'minimal';
  excludedDomains: string[];
  bossKeyUrl: string;
}

export const STORAGE_KEY = 'workmode-state';

export const DEFAULT_STATE: WorkModeState = {
  enabled: false,
  hideImages: true,
  hideVideos: true,
  hideEmojis: true,
  hideTab: true,
  theme: 'minimal',
  excludedDomains: [],
  bossKeyUrl: 'https://docs.google.com/spreadsheets',
};

// 메시지 타입
export const MSG = {
  STATE_CHANGED: 'STATE_CHANGED',
  GET_STATE: 'GET_STATE',
  TOGGLE_WORKMODE: 'TOGGLE_WORKMODE',
  TOGGLE_IMAGES: 'TOGGLE_IMAGES',
  TOGGLE_VIDEOS: 'TOGGLE_VIDEOS',
  TOGGLE_EMOJIS: 'TOGGLE_EMOJIS',
  TOGGLE_TAB: 'TOGGLE_TAB',
  SET_DOMAIN_EXCLUDED: 'SET_DOMAIN_EXCLUDED',
  SET_THEME: 'SET_THEME',
  SET_BOSS_KEY_URL: 'SET_BOSS_KEY_URL',
} as const;

// 메시지별 payload 타입
export interface MsgPayloadMap {
  [MSG.STATE_CHANGED]: WorkModeState;
  [MSG.GET_STATE]: undefined;
  [MSG.TOGGLE_WORKMODE]: undefined;
  [MSG.TOGGLE_IMAGES]: undefined;
  [MSG.TOGGLE_VIDEOS]: undefined;
  [MSG.TOGGLE_EMOJIS]: undefined;
  [MSG.TOGGLE_TAB]: undefined;
  [MSG.SET_DOMAIN_EXCLUDED]: { domain: string; excluded: boolean };
  [MSG.SET_THEME]: { theme: WorkModeState['theme'] };
  [MSG.SET_BOSS_KEY_URL]: { url: string };
}

export type MsgType = keyof MsgPayloadMap;

export type Message<T extends MsgType = MsgType> =
  MsgPayloadMap[T] extends undefined
    ? { type: T }
    : { type: T; payload: MsgPayloadMap[T] };
