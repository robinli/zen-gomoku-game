import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Board from '../Board';
import { BoardState, Position, Player } from '../../types';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'board.view_results': 'View Results',
                'board.thinking': 'Thinking',
                'board.draw': 'Draw',
                'board.winner_black': 'Black Wins',
                'board.winner_white': 'White Wins',
                'board.game_over': 'Game Over',
                'board.view_board': 'View Board',
            };
            return translations[key] || key;
        },
    }),
}));

describe('Board', () => {
    let emptyBoard: BoardState;
    let mockOnMove: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // 創建空棋盤
        emptyBoard = Array(15).fill(null).map(() => Array(15).fill(null));
        mockOnMove = vi.fn();
    });

    describe('渲染', () => {
        it('應該正確渲染棋盤', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                />
            );

            // 檢查 SVG 元素存在
            const svg = document.querySelector('svg');
            expect(svg).toBeTruthy();
        });

        it('應該渲染 15x15 的網格線', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                />
            );

            // 檢查網格線數量（15條橫線 + 15條豎線 = 30條線）
            const lines = document.querySelectorAll('line');
            expect(lines.length).toBe(30);
        });

        it('應該渲染星位點', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                />
            );

            // 檢查星位點（3x3 = 9個）
            const starPoints = document.querySelectorAll('circle[r="3"][fill="#5d4037"]');
            expect(starPoints.length).toBe(9);
        });

        it('應該渲染棋子', () => {
            const boardWithStones = [...emptyBoard];
            boardWithStones[7][7] = 'black';
            boardWithStones[7][8] = 'white';

            render(
                <Board
                    board={boardWithStones}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                />
            );

            // 檢查棋子（不包括星位點）
            const allCircles = document.querySelectorAll('circle');
            const stoneCircles = Array.from(allCircles).filter(
                circle => circle.getAttribute('r') !== '3' || !circle.getAttribute('fill')?.includes('#5d4037')
            );
            expect(stoneCircles.length).toBeGreaterThan(0);
        });
    });

    describe('交互', () => {
        it('應該處理點擊事件', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                />
            );

            // 點擊棋盤中心位置
            const cells = document.querySelectorAll('rect[fill="transparent"]');
            const centerCell = cells[7 * 15 + 7]; // (7, 7) 位置

            fireEvent.click(centerCell);

            expect(mockOnMove).toHaveBeenCalledWith({ x: 7, y: 7 });
        });

        it('禁用時不應該處理點擊', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                    disabled={true}
                />
            );

            const cells = document.querySelectorAll('rect[fill="transparent"]');
            fireEvent.click(cells[0]);

            expect(mockOnMove).not.toHaveBeenCalled();
        });

        it('應該允許點擊不同的位置', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                />
            );

            const cells = document.querySelectorAll('rect[fill="transparent"]');

            // 點擊 (0, 0)
            fireEvent.click(cells[0]);
            expect(mockOnMove).toHaveBeenCalledWith({ x: 0, y: 0 });

            // 點擊 (14, 14)
            fireEvent.click(cells[14 * 15 + 14]);
            expect(mockOnMove).toHaveBeenCalledWith({ x: 14, y: 14 });
        });
    });

    describe('最後一步標記', () => {
        it('應該標記最後一步', () => {
            const boardWithStones = [...emptyBoard];
            boardWithStones[7][7] = 'black';

            const { container } = render(
                <Board
                    board={boardWithStones}
                    onMove={mockOnMove}
                    lastMove={{ x: 7, y: 7 }}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="white"
                />
            );

            // 檢查是否有最後一步的標記（小圓點）
            const lastMoveMarkers = container.querySelectorAll('circle[r="3"]');
            const hasLastMoveMarker = Array.from(lastMoveMarkers).some(
                circle => circle.getAttribute('fill') === '#ffffff'
            );
            expect(hasLastMoveMarker).toBe(true);
        });
    });

    describe('勝利線條', () => {
        it('應該高亮顯示勝利線條', () => {
            const boardWithWin = [...emptyBoard];
            for (let i = 0; i < 5; i++) {
                boardWithWin[7][7 + i] = 'black';
            }

            const winningLine: Position[] = [
                { x: 7, y: 7 },
                { x: 8, y: 7 },
                { x: 9, y: 7 },
                { x: 10, y: 7 },
                { x: 11, y: 7 },
            ];

            const { container } = render(
                <Board
                    board={boardWithWin}
                    onMove={mockOnMove}
                    lastMove={{ x: 11, y: 7 }}
                    winner="black"
                    winningLine={winningLine}
                    threatLine={null}
                    turn="black"
                />
            );

            // 檢查是否有高亮圓圈
            const highlightCircles = container.querySelectorAll('circle[stroke="#fbbf24"]');
            expect(highlightCircles.length).toBeGreaterThan(0);
        });
    });

    describe('威脅提示', () => {
        it('應該顯示威脅棋子', () => {
            const boardWithThreat = [...emptyBoard];
            boardWithThreat[7][7] = 'black';
            boardWithThreat[7][8] = 'black';
            boardWithThreat[7][9] = 'black';

            const threatLine: Position[] = [
                { x: 7, y: 7 },
                { x: 8, y: 7 },
                { x: 9, y: 7 },
            ];

            const { container } = render(
                <Board
                    board={boardWithThreat}
                    onMove={mockOnMove}
                    lastMove={{ x: 9, y: 7 }}
                    winner={null}
                    winningLine={null}
                    threatLine={threatLine}
                    turn="white"
                />
            );

            // 檢查是否有威脅高亮
            const threatCircles = container.querySelectorAll('circle[stroke="#fbbf24"]');
            expect(threatCircles.length).toBeGreaterThan(0);
        });
    });

    describe('遊戲結束覆蓋層', () => {
        it('黑方勝利時應該顯示覆蓋層', () => {
            const boardWithWin = [...emptyBoard];
            for (let i = 0; i < 5; i++) {
                boardWithWin[7][7 + i] = 'black';
            }

            render(
                <Board
                    board={boardWithWin}
                    onMove={mockOnMove}
                    lastMove={{ x: 11, y: 7 }}
                    winner="black"
                    winningLine={[]}
                    threatLine={null}
                    turn="black"
                />
            );

            expect(screen.getByText('Black Wins')).toBeTruthy();
            expect(screen.getByText('Game Over')).toBeTruthy();
        });

        it('白方勝利時應該顯示覆蓋層', () => {
            const boardWithWin = [...emptyBoard];
            for (let i = 0; i < 5; i++) {
                boardWithWin[7][7 + i] = 'white';
            }

            render(
                <Board
                    board={boardWithWin}
                    onMove={mockOnMove}
                    lastMove={{ x: 11, y: 7 }}
                    winner="white"
                    winningLine={[]}
                    threatLine={null}
                    turn="white"
                />
            );

            expect(screen.getByText('White Wins')).toBeTruthy();
        });

        it('平局時應該顯示覆蓋層', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner="draw"
                    winningLine={null}
                    threatLine={null}
                    turn="black"
                />
            );

            expect(screen.getByText('Draw')).toBeTruthy();
        });

        it('應該能關閉覆蓋層', () => {
            const { container } = render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner="black"
                    winningLine={[]}
                    threatLine={null}
                    turn="black"
                />
            );

            // 點擊關閉按鈕
            const closeButton = screen.getByTitle('查看棋盤');
            fireEvent.click(closeButton);

            // 覆蓋層應該消失，但"View Results"按鈕應該出現
            expect(screen.getByText('View Results')).toBeTruthy();
        });

        it('應該能重新打開覆蓋層', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner="black"
                    winningLine={[]}
                    threatLine={null}
                    turn="black"
                />
            );

            // 關閉覆蓋層
            const closeButton = screen.getByTitle('查看棋盤');
            fireEvent.click(closeButton);

            // 點擊"View Results"按鈕重新打開
            const viewResultsButton = screen.getByText('View Results');
            fireEvent.click(viewResultsButton);

            // 覆蓋層應該重新出現
            expect(screen.getByText('Black Wins')).toBeTruthy();
        });
    });

    describe('禁用狀態', () => {
        it('禁用時應該顯示"Thinking"指示器', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner={null}
                    winningLine={null}
                    threatLine={null}
                    turn="white"
                    disabled={true}
                />
            );

            expect(screen.getByText('Thinking')).toBeTruthy();
        });

        it('遊戲結束時不應該顯示"Thinking"指示器', () => {
            render(
                <Board
                    board={emptyBoard}
                    onMove={mockOnMove}
                    lastMove={null}
                    winner="black"
                    winningLine={[]}
                    threatLine={null}
                    turn="black"
                    disabled={true}
                />
            );

            expect(screen.queryByText('Thinking')).toBeNull();
        });
    });

    describe('邊界情況', () => {
        it('應該處理空的勝利線條', () => {
            expect(() => {
                render(
                    <Board
                        board={emptyBoard}
                        onMove={mockOnMove}
                        lastMove={null}
                        winner="black"
                        winningLine={[]}
                        threatLine={null}
                        turn="black"
                    />
                );
            }).not.toThrow();
        });

        it('應該處理空的威脅線條', () => {
            expect(() => {
                render(
                    <Board
                        board={emptyBoard}
                        onMove={mockOnMove}
                        lastMove={null}
                        winner={null}
                        winningLine={null}
                        threatLine={[]}
                        turn="black"
                    />
                );
            }).not.toThrow();
        });

        it('應該處理滿棋盤', () => {
            const fullBoard = emptyBoard.map((row, y) =>
                row.map((_, x) => ((x + y) % 2 === 0 ? 'black' : 'white') as Player)
            );

            expect(() => {
                render(
                    <Board
                        board={fullBoard}
                        onMove={mockOnMove}
                        lastMove={{ x: 14, y: 14 }}
                        winner="draw"
                        winningLine={null}
                        threatLine={null}
                        turn="black"
                    />
                );
            }).not.toThrow();
        });
    });
});
