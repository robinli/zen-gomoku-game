import CryptoJS from 'crypto-js';

/**
 * 安全的 LocalStorage 工具
 * 
 * 提供加密的 localStorage 存取功能
 * 使用 AES 加密保護敏感資料
 */

// 加密密鑰 (實際應用中應該從環境變數讀取)
const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET || 'zen-gomoku-secret-key-2026';

/**
 * 加密資料
 */
function encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

/**
 * 解密資料
 */
function decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * 安全的 LocalStorage 類
 */
class SecureStorage {
    /**
     * 設置加密的項目
     */
    setItem(key: string, value: any): void {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const encryptedValue = encrypt(stringValue);
            localStorage.setItem(key, encryptedValue);
        } catch (error) {
            console.error('SecureStorage.setItem error:', error);
        }
    }

    /**
     * 獲取並解密項目
     */
    getItem(key: string): string | null {
        try {
            const encryptedValue = localStorage.getItem(key);
            if (!encryptedValue) return null;

            return decrypt(encryptedValue);
        } catch (error) {
            console.error('SecureStorage.getItem error:', error);
            // 如果解密失敗，可能是舊的未加密資料，直接返回
            return localStorage.getItem(key);
        }
    }

    /**
     * 獲取並解析 JSON
     */
    getJSON<T>(key: string): T | null {
        try {
            const value = this.getItem(key);
            if (!value) return null;

            return JSON.parse(value) as T;
        } catch (error) {
            console.error('SecureStorage.getJSON error:', error);
            return null;
        }
    }

    /**
     * 移除項目
     */
    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    /**
     * 清除所有項目
     */
    clear(): void {
        localStorage.clear();
    }

    /**
     * 檢查項目是否存在
     */
    hasItem(key: string): boolean {
        return localStorage.getItem(key) !== null;
    }

    /**
     * 獲取所有鍵
     */
    keys(): string[] {
        return Object.keys(localStorage);
    }

    /**
     * 遷移舊的未加密資料
     */
    migrateUnencryptedData(key: string): void {
        try {
            const value = localStorage.getItem(key);
            if (!value) return;

            // 嘗試解密，如果失敗說明是未加密的資料
            try {
                decrypt(value);
                // 已經是加密的，不需要遷移
            } catch {
                // 未加密，進行遷移
                console.log(`Migrating unencrypted data for key: ${key}`);
                this.setItem(key, value);
            }
        } catch (error) {
            console.error('Migration error:', error);
        }
    }
}

// 導出單例
export const secureStorage = new SecureStorage();

// 也導出類，以便需要時創建新實例
export { SecureStorage };
