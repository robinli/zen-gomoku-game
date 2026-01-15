import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GameInfo from '../GameInfo';
import { GameRoom, Player, RoomStats } from '../../types';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, params?: any) => {
            const translations: Record<string, string> = {
                'message.share_title': 'Join my Gomoku game',
                'message.share_text': 'Play Gomoku with me',
                'game_info.share_success': 'Shared successfully',
                'message.share_error': 'Share error',
                'message.copy_prompt': 'Copy this link',
                'app.reconnecting': 'Reconnecting',
                'app.connected': 'Connected',
                'app.waiting': 'Waiting',
                'game_info.invite_friend': 'Invite Friend',
                'game_info.invite_text_share': 'Share this link',
                'game_info.invite_text_copy': 'Copy this link',
                'game_info.share_link': 'Share Link',
                'game_info.or_copy': 'Or Copy',
                'game_info.copy_link': 'Copy Link',
                'game_info.copied': 'Copied!',
                'game_info.share_hint': 'Share hint',
                'game_info.waiting_response': 'Waiting for response',
                'game_info.request_undo': 'Request Undo',
                'game_info.replay_game': 'Replay Game',
                'game_info.play_again': 'Play Again',
                'game_info.restart_game': 'Restart Game',
                'game_info.black_player': 'Black',
                'game_info.white_player': 'White',
                'game_info.you': ' (You)',
                'game_info.vs': 'vs',
                'game_info.back_to_lobby': 'Back to Lobby',
                'game_info.identity': `You are ${params?.identity}`,
                'game_info.identity_black': 'Black',
                'game_info.identity_white': 'White',
            };
            return translations[key] || key;
        },
    }),
}));

describe('GameInfo', () => {
    let mockRoom: GameRoom;
    let mockRoomStats: RoomStats;
    let mockOnReset: ReturnType<typeof vi.fn>;
    let mockOnGoHome: ReturnType<typeof vi.fn>;
    let mockOnRequestUndo: ReturnType<typeof vi.fn>;
    let mockOnStartReplay: ReturnType<typeof vi.fn>;

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

        mockRoomStats = {
            black: { wins: 0, losses: 0, draws: 0 },
            white: { wins: 0, losses: 0, draws: 0 },
        };

        mockOnReset = vi.fn();
        mockOnGoHome = vi.fn();
        mockOnRequestUndo = vi.fn();
        mockOnStartReplay = vi.fn();

        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn(() => Promise.resolve()),
            },
            share: undefined, // 默認不支持 share API
        });
    });

    describe('渲染', () => {
        it('應該正確渲染基本結構', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Back to Lobby')).toBeTruthy();
        });

        it('應該顯示玩家身份', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText(/You are Black/)).toBeTruthy();
        });
    });

    describe('分享功能', () => {
        it('等待對手時應該顯示邀請區域', () => {
            const roomWaiting = { ...mockRoom, players: { black: 'player1' } };

            render(
                <GameInfo
                    room={roomWaiting}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Invite Friend')).toBeTruthy();
        });

        it('雙方都加入後不應該顯示邀請區域', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.queryByText('Invite Friend')).toBeNull();
        });

        it('應該能複製連結', async () => {
            const roomWaiting = { ...mockRoom, players: { black: 'player1' } };

            render(
                <GameInfo
                    room={roomWaiting}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            const copyButton = screen.getByText('Copy Link');
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalled();
                expect(screen.getByText('Copied!')).toBeTruthy();
            });
        });

        it('支持 Web Share API 時應該顯示分享按鈕', () => {
            Object.assign(navigator, {
                share: vi.fn(() => Promise.resolve()),
            });

            const roomWaiting = { ...mockRoom, players: { black: 'player1' } };

            render(
                <GameInfo
                    room={roomWaiting}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Share Link')).toBeTruthy();
        });
    });

    describe('悔棋按鈕', () => {
        it('雙方都加入且遊戲進行中時應該顯示悔棋按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Request Undo')).toBeTruthy();
        });

        it('遊戲結束時不應該顯示悔棋按鈕', () => {
            const roomWithWinner = { ...mockRoom, winner: 'black' as Player };

            render(
                <GameInfo
                    room={roomWithWinner}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.queryByText('Request Undo')).toBeNull();
        });

        it('應該能點擊悔棋按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            const undoButton = screen.getByText('Request Undo');
            fireEvent.click(undoButton);

            expect(mockOnRequestUndo).toHaveBeenCalled();
        });

        it('等待悔棋回應時應該禁用按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    isWaitingUndo={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Waiting for response')).toBeTruthy();
            const undoButton = screen.getByText('Waiting for response').closest('button');
            expect(undoButton?.disabled).toBe(true);
        });

        it('應該顯示悔棋次數', () => {
            const roomWithUndoCount = {
                ...mockRoom,
                undoCount: { black: 1, white: 0 },
            };

            render(
                <GameInfo
                    room={roomWithUndoCount}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText(/\(1\/3\)/)).toBeTruthy();
        });

        it('悔棋次數為 0 時應該禁用按鈕', () => {
            const roomNoUndo = {
                ...mockRoom,
                settings: { ...mockRoom.settings, undoLimit: 0 },
            };

            render(
                <GameInfo
                    room={roomNoUndo}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            const undoButton = screen.getByText('Request Undo').closest('button');
            expect(undoButton?.disabled).toBe(true);
        });
    });

    describe('回放按鈕', () => {
        it('遊戲結束時應該顯示回放按鈕', () => {
            const roomWithWinner = { ...mockRoom, winner: 'black' as Player };

            render(
                <GameInfo
                    room={roomWithWinner}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    onStartReplay={mockOnStartReplay}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Replay Game')).toBeTruthy();
        });

        it('遊戲進行中不應該顯示回放按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    onStartReplay={mockOnStartReplay}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.queryByText('Replay Game')).toBeNull();
        });

        it('應該能點擊回放按鈕', () => {
            const roomWithWinner = { ...mockRoom, winner: 'black' as Player };

            render(
                <GameInfo
                    room={roomWithWinner}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    onStartReplay={mockOnStartReplay}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            const replayButton = screen.getByText('Replay Game');
            fireEvent.click(replayButton);

            expect(mockOnStartReplay).toHaveBeenCalled();
        });
    });

    describe('重置按鈕', () => {
        it('應該總是顯示重置按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Restart Game')).toBeTruthy();
        });

        it('遊戲結束時應該顯示"Play Again"', () => {
            const roomWithWinner = { ...mockRoom, winner: 'black' as Player };

            render(
                <GameInfo
                    room={roomWithWinner}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Play Again')).toBeTruthy();
        });

        it('應該能點擊重置按鈕', () => {
            const boardWithMoves = [...mockRoom.board];
            boardWithMoves[7][7] = 'black';
            const roomWithMoves = { ...mockRoom, board: boardWithMoves };

            render(
                <GameInfo
                    room={roomWithMoves}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            const resetButton = screen.getByText('Restart Game');
            fireEvent.click(resetButton);

            expect(mockOnReset).toHaveBeenCalled();
        });

        it('沒有棋子時應該禁用重置按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            const resetButton = screen.getByText('Restart Game').closest('button');
            expect(resetButton?.disabled).toBe(true);
        });

        it('等待重置回應時應該禁用按鈕', () => {
            const boardWithMoves = [...mockRoom.board];
            boardWithMoves[7][7] = 'black';
            const roomWithMoves = { ...mockRoom, board: boardWithMoves };

            render(
                <GameInfo
                    room={roomWithMoves}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    isWaitingReset={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Waiting for response')).toBeTruthy();
        });
    });

    describe('房間統計', () => {
        it('雙方都加入時應該顯示統計', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Black (You)')).toBeTruthy();
            expect(screen.getByText('White')).toBeTruthy();
            expect(screen.getByText('vs')).toBeTruthy();
        });

        it('應該顯示正確的比分', () => {
            const statsWithWins = {
                black: { wins: 3, losses: 2, draws: 1 },
                white: { wins: 2, losses: 3, draws: 1 },
            };

            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={statsWithWins}
                />
            );

            // 檢查比分顯示
            const scores = screen.getAllByText(/^[0-9]+$/);
            expect(scores.length).toBeGreaterThan(0);
        });

        it('應該高亮當前玩家', () => {
            const { container } = render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="white"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('White (You)')).toBeTruthy();
            expect(screen.getByText(/^Black$/)).toBeTruthy();
        });
    });

    describe('返回大廳按鈕', () => {
        it('應該總是顯示返回大廳按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            expect(screen.getByText('Back to Lobby')).toBeTruthy();
        });

        it('應該能點擊返回大廳按鈕', () => {
            render(
                <GameInfo
                    room={mockRoom}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={true}
                    roomStats={mockRoomStats}
                />
            );

            const goHomeButton = screen.getByText('Back to Lobby');
            fireEvent.click(goHomeButton);

            expect(mockOnGoHome).toHaveBeenCalled();
        });
    });

    describe('連線狀態', () => {
        it('斷線時應該禁用按鈕', () => {
            const boardWithMoves = [...mockRoom.board];
            boardWithMoves[7][7] = 'black';
            const roomWithMoves = { ...mockRoom, board: boardWithMoves };

            render(
                <GameInfo
                    room={roomWithMoves}
                    localPlayer="black"
                    onReset={mockOnReset}
                    onGoHome={mockOnGoHome}
                    onRequestUndo={mockOnRequestUndo}
                    isConnected={false}
                    roomStats={mockRoomStats}
                />
            );

            const resetButton = screen.getByText('Restart Game').closest('button');
            expect(resetButton?.disabled).toBe(true);
        });
    });

    describe('邊界情況', () => {
        it('應該處理 null localPlayer', () => {
            expect(() => {
                render(
                    <GameInfo
                        room={mockRoom}
                        localPlayer={null}
                        onReset={mockOnReset}
                        onGoHome={mockOnGoHome}
                        onRequestUndo={mockOnRequestUndo}
                        isConnected={true}
                        roomStats={mockRoomStats}
                    />
                );
            }).not.toThrow();
        });

        it('應該處理空的 players', () => {
            const emptyRoom = { ...mockRoom, players: {} };

            expect(() => {
                render(
                    <GameInfo
                        room={emptyRoom}
                        localPlayer="black"
                        onReset={mockOnReset}
                        onGoHome={mockOnGoHome}
                        onRequestUndo={mockOnRequestUndo}
                        isConnected={true}
                        roomStats={mockRoomStats}
                    />
                );
            }).not.toThrow();
        });

        it('應該處理沒有 onStartReplay 回調', () => {
            const roomWithWinner = { ...mockRoom, winner: 'black' as Player };

            expect(() => {
                render(
                    <GameInfo
                        room={roomWithWinner}
                        localPlayer="black"
                        onReset={mockOnReset}
                        onGoHome={mockOnGoHome}
                        onRequestUndo={mockOnRequestUndo}
                        isConnected={true}
                        roomStats={mockRoomStats}
                    />
                );
            }).not.toThrow();
        });
    });
});
