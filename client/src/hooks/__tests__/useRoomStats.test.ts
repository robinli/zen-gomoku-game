import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomStats } from '../useRoomStats';

describe('useRoomStats', () => {
    describe('初始化', () => {
        it('應該初始化為零統計', () => {
            const { result } = renderHook(() => useRoomStats());

            expect(result.current.roomStats).toEqual({
                black: { wins: 0, losses: 0, draws: 0 },
                white: { wins: 0, losses: 0, draws: 0 },
            });
        });
    });

    describe('updateStats', () => {
        it('黑方勝利時應該正確更新統計', () => {
            const { result } = renderHook(() => useRoomStats());

            act(() => {
                result.current.updateStats('black');
            });

            expect(result.current.roomStats.black.wins).toBe(1);
            expect(result.current.roomStats.white.losses).toBe(1);
            expect(result.current.roomStats.black.losses).toBe(0);
            expect(result.current.roomStats.white.wins).toBe(0);
        });

        it('白方勝利時應該正確更新統計', () => {
            const { result } = renderHook(() => useRoomStats());

            act(() => {
                result.current.updateStats('white');
            });

            expect(result.current.roomStats.white.wins).toBe(1);
            expect(result.current.roomStats.black.losses).toBe(1);
        });

        it('平局時應該正確更新統計', () => {
            const { result } = renderHook(() => useRoomStats());

            act(() => {
                result.current.updateStats('draw');
            });

            expect(result.current.roomStats.black.draws).toBe(1);
            expect(result.current.roomStats.white.draws).toBe(1);
            expect(result.current.roomStats.black.wins).toBe(0);
            expect(result.current.roomStats.white.wins).toBe(0);
        });

        it('應該防止重複更新同一個勝者', () => {
            const { result } = renderHook(() => useRoomStats());

            act(() => {
                result.current.updateStats('black');
            });

            expect(result.current.roomStats.black.wins).toBe(1);

            // 嘗試再次更新同一個勝者
            act(() => {
                result.current.updateStats('black');
            });

            // 應該仍然是 1，不會增加
            expect(result.current.roomStats.black.wins).toBe(1);
        });

        it('應該允許更新不同的勝者', () => {
            const { result } = renderHook(() => useRoomStats());

            act(() => {
                result.current.updateStats('black');
                result.current.clearWinnerRef();
                result.current.updateStats('white');
            });

            expect(result.current.roomStats.black.wins).toBe(1);
            expect(result.current.roomStats.white.wins).toBe(1);
        });
    });

    describe('resetStats', () => {
        it('應該重置所有統計為零', () => {
            const { result } = renderHook(() => useRoomStats());

            // 先更新一些統計
            act(() => {
                result.current.updateStats('black');
                result.current.clearWinnerRef();
                result.current.updateStats('white');
            });

            expect(result.current.roomStats.black.wins).toBe(1);
            expect(result.current.roomStats.white.wins).toBe(1);

            // 重置
            act(() => {
                result.current.resetStats();
            });

            expect(result.current.roomStats).toEqual({
                black: { wins: 0, losses: 0, draws: 0 },
                white: { wins: 0, losses: 0, draws: 0 },
            });
        });
    });

    describe('clearWinnerRef', () => {
        it('應該清除勝者記錄，允許下次更新', () => {
            const { result } = renderHook(() => useRoomStats());

            act(() => {
                result.current.updateStats('black');
            });

            expect(result.current.roomStats.black.wins).toBe(1);

            // 清除勝者記錄
            act(() => {
                result.current.clearWinnerRef();
            });

            // 現在應該可以再次更新
            act(() => {
                result.current.updateStats('black');
            });

            expect(result.current.roomStats.black.wins).toBe(2);
        });
    });

    describe('多輪遊戲統計', () => {
        it('應該正確累計多輪遊戲的統計', () => {
            const { result } = renderHook(() => useRoomStats());

            // 第一輪：黑方勝
            act(() => {
                result.current.updateStats('black');
                result.current.clearWinnerRef();
            });

            // 第二輪：白方勝
            act(() => {
                result.current.updateStats('white');
                result.current.clearWinnerRef();
            });

            // 第三輪：黑方勝
            act(() => {
                result.current.updateStats('black');
                result.current.clearWinnerRef();
            });

            // 第四輪：平局
            act(() => {
                result.current.updateStats('draw');
            });

            expect(result.current.roomStats).toEqual({
                black: { wins: 2, losses: 1, draws: 1 },
                white: { wins: 1, losses: 2, draws: 1 },
            });
        });
    });
});
