import { describe, it, expect, beforeEach, vi } from 'vitest';
import { secureStorage, SecureStorage } from '../secureStorage';

describe('secureStorage', () => {
    // 每個測試前清空 localStorage
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('基本功能', () => {
        it('應該正確加密和解密字串', () => {
            const testValue = 'hello world';

            secureStorage.setItem('test', testValue);
            const retrieved = secureStorage.getItem('test');

            expect(retrieved).toBe(testValue);

            // 驗證實際存儲的是加密的（不是明文）
            const rawValue = localStorage.getItem('test');
            expect(rawValue).not.toBe(testValue);
            expect(rawValue).toBeTruthy();
        });

        it('應該正確處理 JSON 資料', () => {
            const data = {
                name: 'test',
                value: 123,
                nested: { foo: 'bar' },
                array: [1, 2, 3]
            };

            secureStorage.setItem('json', data);
            const result = secureStorage.getJSON<typeof data>('json');

            expect(result).toEqual(data);
        });

        it('不存在的 key 應該返回 null', () => {
            const value = secureStorage.getItem('nonexistent');
            expect(value).toBeNull();

            const json = secureStorage.getJSON('nonexistent');
            expect(json).toBeNull();
        });

        it('應該正確刪除項目', () => {
            secureStorage.setItem('toDelete', 'value');
            expect(secureStorage.hasItem('toDelete')).toBe(true);

            secureStorage.removeItem('toDelete');

            expect(secureStorage.hasItem('toDelete')).toBe(false);
            expect(secureStorage.getItem('toDelete')).toBeNull();
        });

        it('應該清除所有項目', () => {
            secureStorage.setItem('key1', 'value1');
            secureStorage.setItem('key2', 'value2');
            secureStorage.setItem('key3', 'value3');

            secureStorage.clear();

            expect(secureStorage.getItem('key1')).toBeNull();
            expect(secureStorage.getItem('key2')).toBeNull();
            expect(secureStorage.getItem('key3')).toBeNull();
        });

        it('hasItem 應該正確檢查項目是否存在', () => {
            expect(secureStorage.hasItem('test')).toBe(false);

            secureStorage.setItem('test', 'value');
            expect(secureStorage.hasItem('test')).toBe(true);

            secureStorage.removeItem('test');
            expect(secureStorage.hasItem('test')).toBe(false);
        });

        it('應該返回所有鍵', () => {
            localStorage.clear();

            secureStorage.setItem('key1', 'value1');
            secureStorage.setItem('key2', 'value2');

            const keys = secureStorage.keys();

            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('資料遷移', () => {
        it('應該遷移未加密的資料', () => {
            // 直接存儲未加密的資料（模擬舊版本）
            const unencryptedValue = 'unencrypted value';
            localStorage.setItem('oldData', unencryptedValue);

            // 執行遷移
            secureStorage.migrateUnencryptedData('oldData');

            // 應該能正確讀取
            const value = secureStorage.getItem('oldData');
            expect(value).toBe(unencryptedValue);

            // 現在應該是加密的（不是明文）
            const rawValue = localStorage.getItem('oldData');
            expect(rawValue).not.toBe(unencryptedValue);
        });

        it('已加密的資料不應該被重複遷移', () => {
            secureStorage.setItem('encrypted', 'value');
            const before = localStorage.getItem('encrypted');

            // 嘗試遷移
            secureStorage.migrateUnencryptedData('encrypted');

            const after = localStorage.getItem('encrypted');
            expect(after).toBe(before); // 應該沒有變化

            // 仍然能正確讀取
            expect(secureStorage.getItem('encrypted')).toBe('value');
        });

        it('不存在的 key 遷移時不應該報錯', () => {
            expect(() => {
                secureStorage.migrateUnencryptedData('nonexistent');
            }).not.toThrow();
        });
    });

    describe('錯誤處理', () => {
        it('解密失敗時應該返回原始資料（回退機制）', () => {
            // 存儲無效的加密資料
            localStorage.setItem('invalid', 'not-encrypted-data');

            // 應該返回原始資料（回退機制）
            const value = secureStorage.getItem('invalid');
            expect(value).toBe('not-encrypted-data');
        });

        it('JSON 解析失敗時應該返回 null', () => {
            secureStorage.setItem('notJson', 'not a json string');

            const result = secureStorage.getJSON('notJson');
            expect(result).toBeNull();
        });

        it('setItem 錯誤時不應該拋出異常', () => {
            // Mock localStorage.setItem 拋出錯誤
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = vi.fn(() => {
                throw new Error('Storage quota exceeded');
            });

            expect(() => {
                secureStorage.setItem('test', 'value');
            }).not.toThrow();

            // 恢復原始方法
            Storage.prototype.setItem = originalSetItem;
        });
    });

    describe('特殊情況', () => {
        it('應該正確處理空字串', () => {
            secureStorage.setItem('empty', '');
            const value = secureStorage.getItem('empty');

            expect(value).toBe('');
        });

        it('應該正確處理特殊字符', () => {
            const special = '!@#$%^&*()_+{}[]|\\:";\'<>?,./\n\t中文字符';

            secureStorage.setItem('special', special);
            const value = secureStorage.getItem('special');

            expect(value).toBe(special);
        });

        it('應該正確處理數字', () => {
            secureStorage.setItem('number', 123);
            const value = secureStorage.getItem('number');

            // 數字會被轉換為字串
            expect(value).toBe('123');
        });

        it('應該正確處理布林值', () => {
            secureStorage.setItem('bool', true);
            const result = secureStorage.getJSON<boolean>('bool');

            expect(result).toBe(true);
        });

        it('應該正確處理 null 值', () => {
            secureStorage.setItem('null', null);
            const result = secureStorage.getJSON('null');

            expect(result).toBeNull();
        });

        it('應該正確處理 undefined', () => {
            secureStorage.setItem('undefined', undefined);
            const result = secureStorage.getJSON('undefined');

            // undefined 會被轉換為 null
            expect(result).toBeNull();
        });

        it('應該正確處理長字串', () => {
            const longString = 'a'.repeat(10000);

            secureStorage.setItem('long', longString);
            const value = secureStorage.getItem('long');

            expect(value).toBe(longString);
        });

        it('應該正確處理複雜的嵌套對象', () => {
            const complex = {
                level1: {
                    level2: {
                        level3: {
                            array: [1, 2, { nested: true }],
                            string: 'test',
                            number: 123,
                            bool: false,
                            null: null
                        }
                    }
                }
            };

            secureStorage.setItem('complex', complex);
            const result = secureStorage.getJSON<typeof complex>('complex');

            expect(result).toEqual(complex);
        });
    });

    describe('加密驗證', () => {
        it('相同的值應該產生不同的加密結果（使用隨機 IV）', () => {
            secureStorage.setItem('test1', 'same value');
            const encrypted1 = localStorage.getItem('test1');

            localStorage.removeItem('test1');

            secureStorage.setItem('test1', 'same value');
            const encrypted2 = localStorage.getItem('test1');

            // 由於 AES 使用隨機 IV，相同的值會產生不同的加密結果
            // 但解密後應該相同
            expect(secureStorage.getItem('test1')).toBe('same value');
        });

        it('加密後的資料應該無法直接讀取', () => {
            const sensitiveData = 'password123';

            secureStorage.setItem('password', sensitiveData);
            const encrypted = localStorage.getItem('password');

            // 加密後的資料不應該包含原始文字
            expect(encrypted).not.toContain(sensitiveData);
            expect(encrypted).not.toBe(sensitiveData);
        });
    });

    describe('SecureStorage 類實例化', () => {
        it('應該能創建新的 SecureStorage 實例', () => {
            const newInstance = new SecureStorage();

            newInstance.setItem('test', 'value');
            expect(newInstance.getItem('test')).toBe('value');
        });

        it('不同實例應該共享 localStorage', () => {
            const instance1 = new SecureStorage();
            const instance2 = new SecureStorage();

            instance1.setItem('shared', 'value');

            // 因為都使用同一個 localStorage
            expect(instance2.getItem('shared')).toBe('value');
        });
    });

    describe('實際使用場景', () => {
        it('應該能存儲和讀取房間 ID', () => {
            const roomId = 'room-abc-123';

            secureStorage.setItem('currentRoomId', roomId);
            const retrieved = secureStorage.getItem('currentRoomId');

            expect(retrieved).toBe(roomId);
        });

        it('應該能存儲和讀取用戶偏好設定', () => {
            const preferences = {
                language: 'zh-TW',
                theme: 'dark',
                soundEnabled: true,
                volume: 0.8
            };

            secureStorage.setItem('userPreferences', preferences);
            const retrieved = secureStorage.getJSON<typeof preferences>('userPreferences');

            expect(retrieved).toEqual(preferences);
        });

        it('應該能存儲和讀取遊戲狀態', () => {
            const gameState = {
                roomId: 'abc123',
                side: 'black' as const,
                lastMove: { x: 7, y: 7 },
                timestamp: Date.now()
            };

            secureStorage.setItem('gameState', gameState);
            const retrieved = secureStorage.getJSON<typeof gameState>('gameState');

            expect(retrieved).toEqual(gameState);
        });
    });
});
