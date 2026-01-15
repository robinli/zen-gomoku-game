import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameActions } from '../useGameActions';
import { GameRoom, Player } from '../../types';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, params?: any) => {
            // 簡單的翻譯 mock
            const translations: Record<string, string> = {
                'app.connection_lost_refresh': 'Connection lost',
                'app.cannot_undo_title': 'Cannot undo',
                'app.cannot_undo_not_allowed': 'Undo not allowed',
                'app.cannot_undo_limit': `Used ${params?.used}/${params?.limit}`,
                'app.cannot_undo_no_steps': 'No steps to undo',
                'app.cannot_undo_only_own': 'Can only undo own move',
                'message.request_undo_log': 'Requesting undo',
                'message.respond_undo_log': `Responding undo: ${params?.accept}`,
                'message.request_reset_log': 'Requesting reset',
                'message.respond_reset_log': `Responding reset: ${params?.accept}`,
                'dialog.agree': 'Agree',
                'dialog.reject': 'Reject',
            };
            return translations[key] || key;
        },
    }),
}));

describe('useGameActions', () => {
    let mockRoom: GameRoom;
    let mockSocketService: any;
    let mockIsProcessingMove: React.MutableRefObject<boolean>;
    let mockCallbacks: any;

    beforeEach(() => {
        // 創建 mock room
        mockRoom = {
            id: 'test-room',
            players: { black: 'player1', white: 'player2' },
            board: Array(15).fill(null).map(() => Array(15).fill(null)),
            turn: 'black' as Player,
            winner: null,
            history: [],
            settings: {
                undoLimit: 3,
                timeLimit: null,
            },
            undoCount: { black: 0, white: 0 },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // 創建 mock socket service
        mockSocketService = {
            isConnected: vi.fn(() => true),
            makeMove: vi.fn(),
            requestUndo: vi.fn(),
            respondUndo: vi.fn(),
            requestReset: vi.fn(),
            respondReset: vi.fn(),
        };

        // 創建 mock ref
        mockIsProcessingMove = { current: false };

        // 創建 mock callbacks
        mockCallbacks = {
            setError: vi.fn(),
            setRoom: vi.fn(),
            setMessageDialog: vi.fn(),
            setIsWaitingUndo: vi.fn(),
            setUndoRequest: vi.fn(),
            setIsWaitingReset: vi.fn(),
            setResetRequest: vi.fn(),
        };
    });

    describe('handleMove', () => {
        it('應該正確處理合法的移動', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockIsProcessingMove.current).toBe(true);
            expect(mockCallbacks.setRoom).toHaveBeenCalled();
            expect(mockSocketService.makeMove).toHaveBeenCalledWith(7, 7);
        });

        it('room 為 null 時不應該處理移動', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    null,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockSocketService.makeMove).not.toHaveBeenCalled();
        });

        it('localPlayer 為 null 時不應該處理移動', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    null,
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockSocketService.makeMove).not.toHaveBeenCalled();
        });

        it('遊戲已結束時不應該處理移動', () => {
            mockRoom.winner = 'black';

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockSocketService.makeMove).not.toHaveBeenCalled();
        });

        it('不是自己的回合時不應該處理移動', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'white', // 但 turn 是 black
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockSocketService.makeMove).not.toHaveBeenCalled();
        });

        it('位置已有棋子時不應該處理移動', () => {
            mockRoom.board[7][7] = 'black';

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockSocketService.makeMove).not.toHaveBeenCalled();
        });

        it('連線中斷時應該顯示錯誤', () => {
            mockSocketService.isConnected.mockReturnValue(false);

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockCallbacks.setError).toHaveBeenCalledWith('Connection lost');
            expect(mockSocketService.makeMove).not.toHaveBeenCalled();
        });

        it('應該進行樂觀更新', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleMove({ x: 7, y: 7 });

            expect(mockCallbacks.setRoom).toHaveBeenCalled();
            const setRoomCall = mockCallbacks.setRoom.mock.calls[0][0];
            const newRoom = setRoomCall(mockRoom);

            expect(newRoom.board[7][7]).toBe('black');
            expect(newRoom.lastMove).toEqual({ x: 7, y: 7 });
        });
    });

    describe('handleRequestUndo', () => {
        it('應該正確請求悔棋', () => {
            mockRoom.history = [
                { player: 'black', position: { x: 7, y: 7 }, timestamp: 1000 },
            ];

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestUndo();

            expect(mockCallbacks.setIsWaitingUndo).toHaveBeenCalledWith(true);
            expect(mockSocketService.requestUndo).toHaveBeenCalled();
        });

        it('room 為 null 時不應該請求悔棋', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    null,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestUndo();

            expect(mockSocketService.requestUndo).not.toHaveBeenCalled();
        });

        it('悔棋次數為 0 時應該顯示訊息', () => {
            mockRoom.settings.undoLimit = 0;

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestUndo();

            expect(mockCallbacks.setMessageDialog).toHaveBeenCalledWith({
                title: 'Cannot undo',
                message: 'Undo not allowed',
                icon: 'info',
            });
            expect(mockSocketService.requestUndo).not.toHaveBeenCalled();
        });

        it('超過悔棋次數限制時應該顯示訊息', () => {
            mockRoom.settings.undoLimit = 3;
            mockRoom.undoCount.black = 3;

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestUndo();

            expect(mockCallbacks.setMessageDialog).toHaveBeenCalled();
            expect(mockSocketService.requestUndo).not.toHaveBeenCalled();
        });

        it('沒有歷史記錄時應該顯示訊息', () => {
            mockRoom.history = [];

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestUndo();

            expect(mockCallbacks.setMessageDialog).toHaveBeenCalledWith({
                title: 'Cannot undo',
                message: 'No steps to undo',
                icon: 'info',
            });
            expect(mockSocketService.requestUndo).not.toHaveBeenCalled();
        });

        it('最後一步不是自己下的時應該顯示訊息', () => {
            mockRoom.history = [
                { player: 'white', position: { x: 7, y: 7 }, timestamp: 1000 },
            ];

            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestUndo();

            expect(mockCallbacks.setMessageDialog).toHaveBeenCalledWith({
                title: 'Cannot undo',
                message: 'Can only undo own move',
                icon: 'info',
            });
            expect(mockSocketService.requestUndo).not.toHaveBeenCalled();
        });
    });

    describe('handleRespondUndo', () => {
        it('應該正確回應同意悔棋', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRespondUndo(true);

            expect(mockSocketService.respondUndo).toHaveBeenCalledWith(true);
            expect(mockCallbacks.setUndoRequest).toHaveBeenCalledWith(null);
        });

        it('應該正確回應拒絕悔棋', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRespondUndo(false);

            expect(mockSocketService.respondUndo).toHaveBeenCalledWith(false);
            expect(mockCallbacks.setUndoRequest).toHaveBeenCalledWith(null);
        });
    });

    describe('handleRequestReset', () => {
        it('應該正確請求重置', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestReset();

            expect(mockCallbacks.setIsWaitingReset).toHaveBeenCalledWith(true);
            expect(mockSocketService.requestReset).toHaveBeenCalled();
        });

        it('room 為 null 時不應該請求重置', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    null,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRequestReset();

            expect(mockSocketService.requestReset).not.toHaveBeenCalled();
        });
    });

    describe('handleRespondReset', () => {
        it('應該正確回應同意重置', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRespondReset(true);

            expect(mockSocketService.respondReset).toHaveBeenCalledWith(true);
            expect(mockCallbacks.setResetRequest).toHaveBeenCalledWith(null);
        });

        it('應該正確回應拒絕重置', () => {
            const { result } = renderHook(() =>
                useGameActions(
                    mockRoom,
                    'black',
                    mockSocketService,
                    mockIsProcessingMove,
                    mockCallbacks
                )
            );

            result.current.handleRespondReset(false);

            expect(mockSocketService.respondReset).toHaveBeenCalledWith(false);
            expect(mockCallbacks.setResetRequest).toHaveBeenCalledWith(null);
        });
    });
});
