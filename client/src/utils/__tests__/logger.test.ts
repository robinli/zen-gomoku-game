import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
    // Mock console 方法
    let consoleLogSpy: any;
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;
    let consoleGroupSpy: any;
    let consoleGroupEndSpy: any;
    let consoleTableSpy: any;
    let consoleTimeSpy: any;
    let consoleTimeEndSpy: any;

    beforeEach(() => {
        // 創建 spy
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
        consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => { });
        consoleTableSpy = vi.spyOn(console, 'table').mockImplementation(() => { });
        consoleTimeSpy = vi.spyOn(console, 'time').mockImplementation(() => { });
        consoleTimeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('開發環境', () => {
        // 注意：在測試環境中，import.meta.env.DEV 通常是 true

        it('debug 應該輸出日誌', () => {
            logger.debug('test message', { foo: 'bar' });

            expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'test message', { foo: 'bar' });
        });

        it('info 應該輸出日誌', () => {
            logger.info('info message');

            expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 'info message');
        });

        it('log 應該輸出日誌', () => {
            logger.log('log message');

            expect(consoleLogSpy).toHaveBeenCalledWith('log message');
        });

        it('emoji 應該輸出帶表情的日誌', () => {
            logger.emoji('🎉', 'celebration');

            expect(consoleLogSpy).toHaveBeenCalledWith('🎉', 'celebration');
        });

        it('group 應該創建分組', () => {
            logger.group('Test Group');

            expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group');
        });

        it('groupEnd 應該結束分組', () => {
            logger.groupEnd();

            expect(consoleGroupEndSpy).toHaveBeenCalled();
        });

        it('table 應該輸出表格', () => {
            const data = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
            logger.table(data);

            expect(consoleTableSpy).toHaveBeenCalledWith(data);
        });

        it('time 應該開始計時', () => {
            logger.time('test-timer');

            expect(consoleTimeSpy).toHaveBeenCalledWith('test-timer');
        });

        it('timeEnd 應該結束計時', () => {
            logger.timeEnd('test-timer');

            expect(consoleTimeEndSpy).toHaveBeenCalledWith('test-timer');
        });
    });

    describe('所有環境', () => {
        it('warn 應該總是輸出警告', () => {
            logger.warn('warning message');

            expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'warning message');
        });

        it('error 應該總是輸出錯誤', () => {
            logger.error('error message');

            expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'error message');
        });

        it('warn 應該支持多個參數', () => {
            logger.warn('warning', { code: 500 }, 'details');

            expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'warning', { code: 500 }, 'details');
        });

        it('error 應該支持多個參數', () => {
            const error = new Error('test error');
            logger.error('error occurred', error);

            expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'error occurred', error);
        });
    });

    describe('參數處理', () => {
        it('應該支持無參數調用', () => {
            logger.debug();
            logger.info();
            logger.log();

            expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        });

        it('應該支持單個參數', () => {
            logger.debug('single');

            expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'single');
        });

        it('應該支持多個參數', () => {
            logger.debug('arg1', 'arg2', 'arg3');

            expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'arg1', 'arg2', 'arg3');
        });

        it('應該支持不同類型的參數', () => {
            const obj = { key: 'value' };
            const arr = [1, 2, 3];
            const num = 42;
            const bool = true;

            logger.info('mixed', obj, arr, num, bool);

            expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 'mixed', obj, arr, num, bool);
        });
    });

    describe('實際使用場景', () => {
        it('應該記錄遊戲事件', () => {
            logger.emoji('🎮', '遊戲開始');
            logger.debug('房間 ID:', 'room-123');
            logger.info('玩家加入:', { player: 'black', name: 'Alice' });

            expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        });

        it('應該記錄錯誤和警告', () => {
            logger.warn('連線不穩定');
            logger.error('連線失敗', new Error('Network error'));

            expect(consoleWarnSpy).toHaveBeenCalledOnce();
            expect(consoleErrorSpy).toHaveBeenCalledOnce();
        });

        it('應該支持分組日誌', () => {
            logger.group('遊戲狀態');
            logger.debug('回合:', 5);
            logger.debug('當前玩家:', 'black');
            logger.groupEnd();

            expect(consoleGroupSpy).toHaveBeenCalledWith('遊戲狀態');
            expect(consoleLogSpy).toHaveBeenCalledTimes(2);
            expect(consoleGroupEndSpy).toHaveBeenCalled();
        });

        it('應該支持性能測量', () => {
            logger.time('棋盤渲染');
            // 模擬一些操作
            logger.timeEnd('棋盤渲染');

            expect(consoleTimeSpy).toHaveBeenCalledWith('棋盤渲染');
            expect(consoleTimeEndSpy).toHaveBeenCalledWith('棋盤渲染');
        });

        it('應該支持表格數據展示', () => {
            const stats = [
                { player: 'black', wins: 3, losses: 2 },
                { player: 'white', wins: 2, losses: 3 },
            ];

            logger.table(stats);

            expect(consoleTableSpy).toHaveBeenCalledWith(stats);
        });
    });

    describe('邊界情況', () => {
        it('應該處理 null 和 undefined', () => {
            logger.debug(null, undefined);

            expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', null, undefined);
        });

        it('應該處理空字符串', () => {
            logger.info('');

            expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', '');
        });

        it('應該處理循環引用的對象', () => {
            const obj: any = { name: 'test' };
            obj.self = obj;

            // 不應該拋出錯誤
            expect(() => {
                logger.debug(obj);
            }).not.toThrow();
        });

        it('應該處理大量數據', () => {
            const largeArray = Array(1000).fill(0).map((_, i) => i);

            expect(() => {
                logger.debug(largeArray);
            }).not.toThrow();
        });
    });
});
