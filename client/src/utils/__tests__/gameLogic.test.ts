import { describe, it, expect } from 'vitest';
import { createEmptyBoard, checkWin, isBoardFull, BOARD_SIZE } from '../gameLogic';
import { BoardState, Player } from '../../types';

describe('gameLogic', () => {
    describe('createEmptyBoard', () => {
        it('應該創建 15x15 的空棋盤', () => {
            const board = createEmptyBoard();

            expect(board).toHaveLength(BOARD_SIZE);
            expect(board[0]).toHaveLength(BOARD_SIZE);
        });

        it('所有格子應該初始化為 null', () => {
            const board = createEmptyBoard();

            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    expect(board[y][x]).toBeNull();
                }
            }
        });

        it('每次調用應該返回新的棋盤實例', () => {
            const board1 = createEmptyBoard();
            const board2 = createEmptyBoard();

            expect(board1).not.toBe(board2);
            board1[0][0] = 'black';
            expect(board2[0][0]).toBeNull();
        });
    });

    describe('checkWin', () => {
        describe('橫向勝利', () => {
            it('應該檢測到橫向五子連線', () => {
                const board = createEmptyBoard();
                // 在中間放置 5 個黑子
                for (let i = 5; i < 10; i++) {
                    board[7][i] = 'black';
                }

                const result = checkWin(board, { x: 7, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('black');
                expect(result?.line).toHaveLength(5);
            });

            it('應該檢測到左邊緣的橫向勝利', () => {
                const board = createEmptyBoard();
                // 從左邊緣開始
                for (let i = 0; i < 5; i++) {
                    board[7][i] = 'white';
                }

                const result = checkWin(board, { x: 2, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('white');
            });

            it('應該檢測到右邊緣的橫向勝利', () => {
                const board = createEmptyBoard();
                // 從右邊緣開始
                for (let i = BOARD_SIZE - 5; i < BOARD_SIZE; i++) {
                    board[7][i] = 'black';
                }

                const result = checkWin(board, { x: BOARD_SIZE - 3, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('black');
            });
        });

        describe('縱向勝利', () => {
            it('應該檢測到縱向五子連線', () => {
                const board = createEmptyBoard();
                // 在中間放置 5 個白子
                for (let i = 5; i < 10; i++) {
                    board[i][7] = 'white';
                }

                const result = checkWin(board, { x: 7, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('white');
                expect(result?.line).toHaveLength(5);
            });

            it('應該檢測到頂部邊緣的縱向勝利', () => {
                const board = createEmptyBoard();
                for (let i = 0; i < 5; i++) {
                    board[i][7] = 'black';
                }

                const result = checkWin(board, { x: 7, y: 2 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('black');
            });

            it('應該檢測到底部邊緣的縱向勝利', () => {
                const board = createEmptyBoard();
                for (let i = BOARD_SIZE - 5; i < BOARD_SIZE; i++) {
                    board[i][7] = 'white';
                }

                const result = checkWin(board, { x: 7, y: BOARD_SIZE - 3 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('white');
            });
        });

        describe('斜向勝利 (\\)', () => {
            it('應該檢測到右下斜向五子連線', () => {
                const board = createEmptyBoard();
                // 從 (5,5) 到 (9,9) 的斜線
                for (let i = 0; i < 5; i++) {
                    board[5 + i][5 + i] = 'black';
                }

                const result = checkWin(board, { x: 7, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('black');
                expect(result?.line).toHaveLength(5);
            });

            it('應該檢測到左上角的斜向勝利', () => {
                const board = createEmptyBoard();
                for (let i = 0; i < 5; i++) {
                    board[i][i] = 'white';
                }

                const result = checkWin(board, { x: 2, y: 2 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('white');
            });

            it('應該檢測到右下角的斜向勝利', () => {
                const board = createEmptyBoard();
                const start = BOARD_SIZE - 5;
                for (let i = 0; i < 5; i++) {
                    board[start + i][start + i] = 'black';
                }

                const result = checkWin(board, { x: start + 2, y: start + 2 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('black');
            });
        });

        describe('反斜向勝利 (/)', () => {
            it('應該檢測到左下斜向五子連線', () => {
                const board = createEmptyBoard();
                // 從 (9,5) 到 (5,9) 的反斜線
                for (let i = 0; i < 5; i++) {
                    board[9 - i][5 + i] = 'white';
                }

                const result = checkWin(board, { x: 7, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('white');
                expect(result?.line).toHaveLength(5);
            });

            it('應該檢測到右上角的反斜向勝利', () => {
                const board = createEmptyBoard();
                for (let i = 0; i < 5; i++) {
                    board[i][BOARD_SIZE - 1 - i] = 'black';
                }

                const result = checkWin(board, { x: BOARD_SIZE - 3, y: 2 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('black');
            });

            it('應該檢測到左下角的反斜向勝利', () => {
                const board = createEmptyBoard();
                const startY = BOARD_SIZE - 5;
                for (let i = 0; i < 5; i++) {
                    board[startY + i][4 - i] = 'white';
                }

                const result = checkWin(board, { x: 2, y: startY + 2 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('white');
            });
        });

        describe('邊界情況', () => {
            it('只有 4 個子時不應該判定為勝利', () => {
                const board = createEmptyBoard();
                // 只放 4 個子
                for (let i = 0; i < 4; i++) {
                    board[7][i] = 'black';
                }

                const result = checkWin(board, { x: 2, y: 7 });

                expect(result).toBeNull();
            });

            it('6 個子時應該判定為勝利', () => {
                const board = createEmptyBoard();
                // 放 6 個子
                for (let i = 0; i < 6; i++) {
                    board[7][i] = 'white';
                }

                const result = checkWin(board, { x: 3, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('white');
                expect(result?.line.length).toBeGreaterThanOrEqual(5);
            });

            it('中間被打斷時不應該判定為勝利', () => {
                const board = createEmptyBoard();
                board[7][0] = 'black';
                board[7][1] = 'black';
                board[7][2] = 'white'; // 中斷
                board[7][3] = 'black';
                board[7][4] = 'black';

                const result = checkWin(board, { x: 1, y: 7 });

                expect(result).toBeNull();
            });

            it('空位置應該返回 null', () => {
                const board = createEmptyBoard();

                const result = checkWin(board, { x: 7, y: 7 });

                expect(result).toBeNull();
            });

            it('不同顏色的子不應該連線', () => {
                const board = createEmptyBoard();
                board[7][0] = 'black';
                board[7][1] = 'black';
                board[7][2] = 'black';
                board[7][3] = 'white';
                board[7][4] = 'white';

                const resultBlack = checkWin(board, { x: 1, y: 7 });
                const resultWhite = checkWin(board, { x: 3, y: 7 });

                expect(resultBlack).toBeNull();
                expect(resultWhite).toBeNull();
            });
        });

        describe('複雜場景', () => {
            it('應該在有多個接近勝利的情況下正確判定', () => {
                const board = createEmptyBoard();
                // 橫向 4 個黑子
                for (let i = 0; i < 4; i++) {
                    board[7][i] = 'black';
                }
                // 縱向 5 個黑子 (勝利)
                for (let i = 5; i < 10; i++) {
                    board[i][7] = 'black';
                }

                const result = checkWin(board, { x: 7, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.winner).toBe('black');
            });

            it('應該返回正確的勝利線條位置', () => {
                const board = createEmptyBoard();
                const positions = [
                    { x: 5, y: 7 },
                    { x: 6, y: 7 },
                    { x: 7, y: 7 },
                    { x: 8, y: 7 },
                    { x: 9, y: 7 },
                ];

                positions.forEach(pos => {
                    board[pos.y][pos.x] = 'white';
                });

                const result = checkWin(board, { x: 7, y: 7 });

                expect(result).not.toBeNull();
                expect(result?.line).toHaveLength(5);

                // 驗證線條包含所有位置
                positions.forEach(pos => {
                    const found = result?.line.some(p => p.x === pos.x && p.y === pos.y);
                    expect(found).toBe(true);
                });
            });
        });
    });

    describe('isBoardFull', () => {
        it('空棋盤應該返回 false', () => {
            const board = createEmptyBoard();

            expect(isBoardFull(board)).toBe(false);
        });

        it('部分填充的棋盤應該返回 false', () => {
            const board = createEmptyBoard();
            board[0][0] = 'black';
            board[7][7] = 'white';

            expect(isBoardFull(board)).toBe(false);
        });

        it('完全填充的棋盤應該返回 true', () => {
            const board = createEmptyBoard();

            // 填滿整個棋盤
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    board[y][x] = (x + y) % 2 === 0 ? 'black' : 'white';
                }
            }

            expect(isBoardFull(board)).toBe(true);
        });

        it('只剩一個空格應該返回 false', () => {
            const board = createEmptyBoard();

            // 填滿除了一個格子
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    if (x === 7 && y === 7) continue; // 留一個空格
                    board[y][x] = (x + y) % 2 === 0 ? 'black' : 'white';
                }
            }

            expect(isBoardFull(board)).toBe(false);
        });
    });
});
