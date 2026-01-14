/**
 * 客戶端遊戲配置常數
 * 集中管理所有魔術數字和配置參數
 */

// 棋盤配置
export const BOARD_CONFIG = {
    /** 棋盤大小 (15x15) */
    SIZE: 15,
    /** 獲勝所需連珠數 */
    WIN_COUNT: 5,
} as const;

// 回放配置
export const REPLAY_CONFIG = {
    /** 自動播放間隔 (毫秒) */
    AUTO_PLAY_INTERVAL_MS: 1000,
    /** 回放速度選項 (毫秒) */
    SPEED_OPTIONS: {
        SLOW: 2000,
        NORMAL: 1000,
        FAST: 500,
    },
} as const;

// UI 配置
export const UI_CONFIG = {
    /** 威脅提示顯示時長 (毫秒) */
    THREAT_DISPLAY_DURATION_MS: 3000,
    /** 錯誤訊息顯示時長 (毫秒) */
    ERROR_MESSAGE_DURATION_MS: 3000,
    /** 自動儲存間隔 (毫秒) */
    AUTO_SAVE_INTERVAL_MS: 5000,
    /** 動畫過渡時長 (毫秒) */
    ANIMATION_DURATION_MS: 300,
} as const;

// Socket 配置
export const SOCKET_CONFIG = {
    /** 重連嘗試次數 */
    RECONNECTION_ATTEMPTS: 5,
    /** 重連延遲 (毫秒) */
    RECONNECTION_DELAY_MS: 1000,
    /** 傳輸方式 */
    TRANSPORTS: ['polling', 'websocket'] as const,
} as const;

// 遊戲規則配置
export const GAME_RULES = {
    /** 預設悔棋次數限制 */
    DEFAULT_UNDO_LIMIT: 3,
    /** 最大悔棋次數限制 */
    MAX_UNDO_LIMIT: 10,
    /** 無限悔棋標記 */
    UNLIMITED_UNDO: null,
    /** 禁止悔棋標記 */
    NO_UNDO: 0,
} as const;

// LocalStorage 鍵名
export const STORAGE_KEYS = {
    /** 當前房間 ID */
    CURRENT_ROOM_ID: 'currentRoomId',
    /** 當前房間方位 */
    CURRENT_ROOM_SIDE: 'currentRoomSide',
    /** 語言設定 */
    LANGUAGE: 'language',
    /** 遊戲設定 */
    GAME_SETTINGS: 'gameSettings',
} as const;

// URL 參數
export const URL_PARAMS = {
    /** 房間 ID 參數名 */
    ROOM_ID: 'room',
} as const;

// 顏色配置
export const COLORS = {
    /** 黑棋顏色 */
    BLACK: '#1e293b',
    /** 白棋顏色 */
    WHITE: '#ffffff',
    /** 棋盤背景色 */
    BOARD_BG: '#e0c097',
    /** 獲勝線條顏色 */
    WINNING_LINE: '#fbbf24',
    /** 威脅線條顏色 */
    THREAT_LINE: '#fbbf24',
} as const;

// 導出所有配置的類型
export type BoardConfig = typeof BOARD_CONFIG;
export type ReplayConfig = typeof REPLAY_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type SocketConfig = typeof SOCKET_CONFIG;
export type GameRules = typeof GAME_RULES;
export type StorageKeys = typeof STORAGE_KEYS;
export type URLParams = typeof URL_PARAMS;
export type Colors = typeof COLORS;
