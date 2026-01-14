/**
 * Server Logger 工具
 * 
 * 根據環境變數控制日誌輸出
 * 生產環境下不輸出 debug/info 級別的日誌
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private isDevelopment: boolean;

    constructor() {
        // 檢查是否為開發環境
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    /**
     * Debug 級別日誌 (僅開發環境)
     */
    debug(...args: any[]): void {
        if (this.isDevelopment) {
            console.log('[DEBUG]', ...args);
        }
    }

    /**
     * Info 級別日誌 (僅開發環境)
     */
    info(...args: any[]): void {
        if (this.isDevelopment) {
            console.log('[INFO]', ...args);
        }
    }

    /**
     * Log 級別日誌 (僅開發環境)
     */
    log(...args: any[]): void {
        if (this.isDevelopment) {
            console.log(...args);
        }
    }

    /**
     * Warning 級別日誌 (所有環境)
     */
    warn(...args: any[]): void {
        console.warn('[WARN]', ...args);
    }

    /**
     * Error 級別日誌 (所有環境)
     */
    error(...args: any[]): void {
        console.error('[ERROR]', ...args);
    }

    /**
     * 帶表情符號的日誌 (僅開發環境)
     */
    emoji(emoji: string, ...args: any[]): void {
        if (this.isDevelopment) {
            console.log(emoji, ...args);
        }
    }

    /**
     * 時間測量開始 (僅開發環境)
     */
    time(label: string): void {
        if (this.isDevelopment) {
            console.time(label);
        }
    }

    /**
     * 時間測量結束 (僅開發環境)
     */
    timeEnd(label: string): void {
        if (this.isDevelopment) {
            console.timeEnd(label);
        }
    }
}

// 導出單例
export const logger = new Logger();

// 導出類型
export type { LogLevel };
