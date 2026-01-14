import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEffectOnce, useMount, useUnmount } from '../useEffectOnce';

describe('useEffectOnce', () => {
    describe('基本功能', () => {
        it('應該只執行一次，即使重新渲染', () => {
            const effect = vi.fn();
            const { rerender } = renderHook(() => useEffectOnce(effect));

            // 第一次渲染應該執行
            expect(effect).toHaveBeenCalledTimes(1);

            // 重新渲染多次
            rerender();
            rerender();
            rerender();

            // 仍然只調用一次
            expect(effect).toHaveBeenCalledTimes(1);
        });

        it('應該在組件卸載時調用清理函數', () => {
            const cleanup = vi.fn();
            const effect = vi.fn(() => cleanup);

            const { unmount } = renderHook(() => useEffectOnce(effect));

            // effect 應該被調用
            expect(effect).toHaveBeenCalledTimes(1);

            // cleanup 還沒被調用
            expect(cleanup).not.toHaveBeenCalled();

            // 卸載組件
            unmount();

            // cleanup 應該被調用一次
            expect(cleanup).toHaveBeenCalledTimes(1);
        });

        it('沒有清理函數時應該正常工作', () => {
            const effect = vi.fn(); // 不返回任何東西

            const { unmount } = renderHook(() => useEffectOnce(effect));

            expect(effect).toHaveBeenCalledTimes(1);

            // 卸載時不應該報錯
            expect(() => unmount()).not.toThrow();
        });

        it('effect 返回 undefined 時應該正常工作', () => {
            const effect = vi.fn(() => undefined);

            const { unmount } = renderHook(() => useEffectOnce(effect));

            expect(effect).toHaveBeenCalledTimes(1);
            expect(() => unmount()).not.toThrow();
        });
    });

    describe('React Strict Mode 相容性', () => {
        it('重新渲染時不應該重複執行 effect', () => {
            const effect = vi.fn();
            const cleanup = vi.fn();
            const effectWithCleanup = vi.fn(() => cleanup);

            const { rerender, unmount } = renderHook(() =>
                useEffectOnce(effectWithCleanup)
            );

            // 初始執行
            expect(effectWithCleanup).toHaveBeenCalledTimes(1);

            // 多次重新渲染
            for (let i = 0; i < 5; i++) {
                rerender();
            }

            // 仍然只執行一次
            expect(effectWithCleanup).toHaveBeenCalledTimes(1);

            // 卸載
            unmount();

            // cleanup 只調用一次
            expect(cleanup).toHaveBeenCalledTimes(1);
        });

        it('應該保存並使用正確的清理函數', () => {
            const cleanup1 = vi.fn();
            const cleanup2 = vi.fn();
            let cleanupToReturn = cleanup1;

            const effect = vi.fn(() => cleanupToReturn);

            const { rerender, unmount } = renderHook(() => useEffectOnce(effect));

            // 第一次執行，返回 cleanup1
            expect(effect).toHaveBeenCalledTimes(1);

            // 改變要返回的 cleanup
            cleanupToReturn = cleanup2;

            // 重新渲染（但 effect 不會再執行）
            rerender();

            // effect 仍然只執行一次
            expect(effect).toHaveBeenCalledTimes(1);

            // 卸載
            unmount();

            // 應該調用第一次的 cleanup1
            expect(cleanup1).toHaveBeenCalledTimes(1);
            expect(cleanup2).not.toHaveBeenCalled();
        });
    });

    describe('邊界情況', () => {
        it('effect 拋出錯誤時應該正確處理', () => {
            const error = new Error('Test error');
            const effect = vi.fn(() => {
                throw error;
            });

            // 應該拋出錯誤
            expect(() => {
                renderHook(() => useEffectOnce(effect));
            }).toThrow('Test error');

            // effect 應該被調用過
            expect(effect).toHaveBeenCalledTimes(1);
        });

        it('清理函數拋出錯誤時應該正確處理', () => {
            const error = new Error('Cleanup error');
            const cleanup = vi.fn(() => {
                throw error;
            });
            const effect = vi.fn(() => cleanup);

            const { unmount } = renderHook(() => useEffectOnce(effect));

            // 卸載時應該拋出錯誤
            expect(() => unmount()).toThrow('Cleanup error');

            // cleanup 應該被調用過
            expect(cleanup).toHaveBeenCalledTimes(1);
        });
    });
});

describe('useMount', () => {
    it('應該在組件掛載時執行一次', () => {
        const callback = vi.fn();

        renderHook(() => useMount(callback));

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('重新渲染時不應該再次執行', () => {
        const callback = vi.fn();

        const { rerender } = renderHook(() => useMount(callback));

        expect(callback).toHaveBeenCalledTimes(1);

        rerender();
        rerender();

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('多個組件實例應該各自執行一次', () => {
        const callback = vi.fn();

        const { unmount: unmount1 } = renderHook(() => useMount(callback));
        expect(callback).toHaveBeenCalledTimes(1);

        const { unmount: unmount2 } = renderHook(() => useMount(callback));
        expect(callback).toHaveBeenCalledTimes(2);

        unmount1();
        unmount2();
    });
});

describe('useUnmount', () => {
    it('應該在組件卸載時執行', () => {
        const callback = vi.fn();

        const { unmount } = renderHook(() => useUnmount(callback));

        // 掛載時不應該執行
        expect(callback).not.toHaveBeenCalled();

        // 卸載時執行
        unmount();

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('應該使用最新的 callback', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const callback3 = vi.fn();

        const { rerender, unmount } = renderHook(
            ({ cb }) => useUnmount(cb),
            { initialProps: { cb: callback1 } }
        );

        // 更新 callback
        rerender({ cb: callback2 });
        rerender({ cb: callback3 });

        // 卸載
        unmount();

        // 應該調用最新的 callback3
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('重新渲染時不應該執行 callback', () => {
        const callback = vi.fn();

        const { rerender, unmount } = renderHook(() => useUnmount(callback));

        // 多次重新渲染
        rerender();
        rerender();
        rerender();

        // 不應該執行
        expect(callback).not.toHaveBeenCalled();

        // 只在卸載時執行
        unmount();
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('callback 拋出錯誤時應該正確處理', () => {
        const error = new Error('Unmount error');
        const callback = vi.fn(() => {
            throw error;
        });

        const { unmount } = renderHook(() => useUnmount(callback));

        // 卸載時應該拋出錯誤
        expect(() => unmount()).toThrow('Unmount error');

        // callback 應該被調用過
        expect(callback).toHaveBeenCalledTimes(1);
    });
});
