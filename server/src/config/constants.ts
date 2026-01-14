/**
 * 服務端配置常數
 * 集中管理所有魔術數字和配置參數
 */

// 房間管理配置
export const ROOM_CONFIG = {
    /** 寬限期時長 (毫秒) - 玩家斷線後的重連寬限期 */
    GRACE_PERIOD_MS: 30 * 1000,
    /** 閒置房間超時時長 (毫秒) - 15 分鐘無活動自動清理 */
    IDLE_ROOM_TIMEOUT_MS: 15 * 60 * 1000,
    /** 房間 ID 長度 */
    ROOM_ID_LENGTH: 6,
    /** 最大玩家數 */
    MAX_PLAYERS: 2,
} as const;

// 遊戲規則配置
export const GAME_RULES = {
    /** 棋盤大小 */
    BOARD_SIZE: 15,
    /** 獲勝所需連珠數 */
    WIN_COUNT: 5,
    /** 預設悔棋次數限制 */
    DEFAULT_UNDO_LIMIT: 3,
    /** 最大悔棋次數限制 */
    MAX_UNDO_LIMIT: 10,
    /** 無限悔棋標記 */
    UNLIMITED_UNDO: null,
    /** 禁止悔棋標記 */
    NO_UNDO: 0,
} as const;

// 服務器配置
export const SERVER_CONFIG = {
    /** 預設端口 */
    DEFAULT_PORT: 3000,
    /** Node.js 最低版本 */
    MIN_NODE_VERSION: '18.0.0',
} as const;

// 監控配置
export const MONITORING_CONFIG = {
    /** 房間清理檢查間隔 (毫秒) */
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 分鐘
    /** 健康檢查間隔 (毫秒) */
    HEALTH_CHECK_INTERVAL_MS: 30 * 1000, // 30 秒
} as const;

// Socket.IO 配置
export const SOCKET_CONFIG = {
    /** 重連嘗試次數 */
    RECONNECTION_ATTEMPTS: 5,
    /** 重連延遲 (毫秒) */
    RECONNECTION_DELAY_MS: 1000,
    /** Ping 超時 (毫秒) */
    PING_TIMEOUT_MS: 20000,
    /** Ping 間隔 (毫秒) */
    PING_INTERVAL_MS: 25000,
} as const;

// 速率限制配置
export const RATE_LIMIT_CONFIG = {
    /** 時間窗口 (毫秒) */
    WINDOW_MS: 15 * 60 * 1000, // 15 分鐘
    /** 最大請求次數 */
    MAX_REQUESTS: 100,
    /** 錯誤訊息 */
    MESSAGE: '請求過於頻繁，請稍後再試',
} as const;

// 日誌配置
export const LOG_CONFIG = {
    /** 是否啟用詳細日誌 */
    VERBOSE: process.env.NODE_ENV !== 'production',
    /** 日誌級別 */
    LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

// 導出所有配置的類型
export type RoomConfig = typeof ROOM_CONFIG;
export type GameRules = typeof GAME_RULES;
export type ServerConfig = typeof SERVER_CONFIG;
export type MonitoringConfig = typeof MONITORING_CONFIG;
export type SocketConfig = typeof SOCKET_CONFIG;
export type RateLimitConfig = typeof RATE_LIMIT_CONFIG;
export type LogConfig = typeof LOG_CONFIG;
