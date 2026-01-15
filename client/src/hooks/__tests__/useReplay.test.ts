import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReplay } from '../useReplay';
import { MoveHistory } from '../../types';

describe('useReplay', () => {
    // Mock 計時器
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllTimers();
    });

    // 測試用的歷史記錄
    const mockHistory: MoveHistory[] = [
        { player: 'black', position: { x: 7, y: 7 }, timestamp: 1000, step: 0 },
        { player: 'white', position: { x: 8, y: 7 }, timestamp: 2000, step: 1 },
        { player: 'black', position: { x: 7, y: 8 }, timestamp: 3000, step: 2 },
        { player: 'white', position: { x: 8, y: 8 }, timestamp: 4000, step: 3 },
        { player: 'black', position: { x: 7, y: 9 }, timestamp: 5000, step: 4 },
    ];

    describe('初始化', () => {
        it('應該有正確的初始狀態', () => {
            const { result } = renderHook(() => useReplay());

            expect(result.current.isReplaying).toBe(false);
            expect(result.current.replayStep).toBe(0);
            expect(result.current.isAutoPlaying).toBe(false);
            expect(result.current.replayHistory).toEqual([]);
        });
    });

    describe('startReplay', () => {
        it('應該正確開始回放', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            expect(result.current.isReplaying).toBe(true);
            expect(result.current.replayStep).toBe(0);
            expect(result.current.isAutoPlaying).toBe(true);
            expect(result.current.replayHistory).toEqual(mockHistory);
        });

        it('空歷史記錄時不應該開始回放', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay([]);
            });

            expect(result.current.isReplaying).toBe(false);
        });

        it('歷史記錄為 null 時不應該開始回放', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(null as any);
            });

            expect(result.current.isReplaying).toBe(false);
        });

        it('應該創建歷史記錄的快照', () => {
            const { result } = renderHook(() => useReplay());
            const originalHistory = [...mockHistory];
            const originalLength = mockHistory.length;

            act(() => {
                result.current.startReplay(mockHistory);
            });

            // 修改原始歷史記錄
            mockHistory.push({ player: 'white', position: { x: 9, y: 9 }, timestamp: 6000, step: 5 });

            // 回放歷史應該不受影響
            expect(result.current.replayHistory).toEqual(originalHistory);

            // 恢復原始狀態
            mockHistory.length = originalLength;
        });
    });

    describe('exitReplay', () => {
        it('應該正確退出回放', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            act(() => {
                result.current.exitReplay();
            });

            expect(result.current.isReplaying).toBe(false);
            expect(result.current.replayStep).toBe(0);
            expect(result.current.isAutoPlaying).toBe(false);
            expect(result.current.replayHistory).toEqual([]);
        });

        it('應該清除自動播放計時器', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            // 確保計時器已啟動
            expect(result.current.isAutoPlaying).toBe(true);

            act(() => {
                result.current.exitReplay();
            });

            // 計時器應該被清除
            expect(result.current.isAutoPlaying).toBe(false);
        });
    });

    describe('步驟導航', () => {
        it('previousStep 應該回到上一步', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            // 先前進幾步
            act(() => {
                result.current.nextStep();
                result.current.nextStep();
            });

            expect(result.current.replayStep).toBe(2);

            // 回到上一步
            act(() => {
                result.current.previousStep();
            });

            expect(result.current.replayStep).toBe(1);
        });

        it('previousStep 在第一步時不應該繼續後退', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            expect(result.current.replayStep).toBe(0);

            act(() => {
                result.current.previousStep();
            });

            expect(result.current.replayStep).toBe(0);
        });

        it('nextStep 應該前進到下一步', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            act(() => {
                result.current.nextStep();
            });

            expect(result.current.replayStep).toBe(1);
        });

        it('nextStep 在最後一步時不應該繼續前進', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            // 前進到最後一步（從 0 開始，所以需要前進 length - 1 次）
            act(() => {
                for (let i = 0; i < mockHistory.length - 1; i++) {
                    result.current.nextStep();
                }
            });

            const lastStep = mockHistory.length - 1;
            expect(result.current.replayStep).toBe(lastStep);

            // 嘗試繼續前進
            act(() => {
                result.current.nextStep();
            });

            expect(result.current.replayStep).toBe(lastStep);
        });
    });

    describe('restartReplay', () => {
        it('應該重置到第一步並停止自動播放', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            // 前進幾步
            act(() => {
                result.current.nextStep();
                result.current.nextStep();
            });

            expect(result.current.replayStep).toBe(2);
            expect(result.current.isAutoPlaying).toBe(true);

            act(() => {
                result.current.restartReplay();
            });

            expect(result.current.replayStep).toBe(0);
            expect(result.current.isAutoPlaying).toBe(false);
        });
    });

    describe('toggleAutoPlay', () => {
        it('應該切換自動播放狀態', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            expect(result.current.isAutoPlaying).toBe(true);

            act(() => {
                result.current.toggleAutoPlay();
            });

            expect(result.current.isAutoPlaying).toBe(false);

            act(() => {
                result.current.toggleAutoPlay();
            });

            expect(result.current.isAutoPlaying).toBe(true);
        });
    });

    describe('fastForward', () => {
        it('應該快進到最後一步', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            expect(result.current.replayStep).toBe(0);

            act(() => {
                result.current.fastForward();
            });

            expect(result.current.replayStep).toBe(mockHistory.length - 1);
        });

        it('空歷史記錄時不應該報錯', () => {
            const { result } = renderHook(() => useReplay());

            expect(() => {
                act(() => {
                    result.current.fastForward();
                });
            }).not.toThrow();
        });
    });

    describe('getReplayBoard', () => {
        it('應該根據步驟重建正確的棋盤', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            // 第 0 步：只有第一個棋子
            let board = result.current.getReplayBoard(0);
            expect(board[7][7]).toBe('black');
            expect(board[7][8]).toBeNull();

            // 第 2 步：前三個棋子
            board = result.current.getReplayBoard(2);
            expect(board[7][7]).toBe('black');
            expect(board[7][8]).toBe('white');
            expect(board[8][7]).toBe('black');
        });

        it('應該返回 15x15 的棋盤', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            const board = result.current.getReplayBoard(0);
            expect(board.length).toBe(15);
            expect(board[0].length).toBe(15);
        });

        it('步驟超出範圍時應該只重建到最後一步', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            const board = result.current.getReplayBoard(999);

            // 應該包含所有 5 個棋子
            expect(board[7][7]).toBe('black');
            expect(board[7][8]).toBe('white');
            expect(board[8][7]).toBe('black');
            expect(board[8][8]).toBe('white');
            expect(board[9][7]).toBe('black');
        });
    });

    describe('自動播放', () => {
        it('應該自動前進步驟', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            expect(result.current.replayStep).toBe(0);

            // 前進一個間隔
            act(() => {
                vi.advanceTimersByTime(1000); // REPLAY_CONFIG.AUTO_PLAY_INTERVAL_MS
            });

            expect(result.current.replayStep).toBe(1);
        });

        it('到達最後一步時應該停止自動播放', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            // 逐步前進，每次 1 秒
            for (let i = 0; i < mockHistory.length; i++) {
                act(() => {
                    vi.advanceTimersByTime(1000);
                });
            }

            expect(result.current.replayStep).toBe(mockHistory.length - 1);
            expect(result.current.isAutoPlaying).toBe(false);
        });

        it('停止自動播放時應該清除計時器', () => {
            const { result } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            expect(result.current.isAutoPlaying).toBe(true);

            act(() => {
                result.current.toggleAutoPlay();
            });

            expect(result.current.isAutoPlaying).toBe(false);

            // 計時器應該被清除，不會繼續前進
            const currentStep = result.current.replayStep;

            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(result.current.replayStep).toBe(currentStep);
        });
    });

    describe('清理', () => {
        it('組件卸載時應該清除計時器', () => {
            const { result, unmount } = renderHook(() => useReplay());

            act(() => {
                result.current.startReplay(mockHistory);
            });

            expect(result.current.isAutoPlaying).toBe(true);

            unmount();

            // 不應該拋出錯誤
            expect(() => {
                vi.advanceTimersByTime(1000);
            }).not.toThrow();
        });
    });
});
