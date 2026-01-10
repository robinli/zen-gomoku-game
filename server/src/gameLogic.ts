
import { BoardState, Player, Position } from './types.js';

export const BOARD_SIZE = 15;

export const createEmptyBoard = (): BoardState =>
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

export interface WinResult {
    winner: Player;
    line: Position[];
}

export const checkWin = (board: BoardState, pos: Position): WinResult | null => {
    const player = board[pos.y][pos.x];
    if (!player) return null;

    const directions = [
        [1, 0],  // Horizontal
        [0, 1],  // Vertical
        [1, 1],  // Diagonal (down-right)
        [1, -1], // Diagonal (up-right)
    ];

    for (const [dx, dy] of directions) {
        let winningLine: Position[] = [{ x: pos.x, y: pos.y }];

        // Check one direction
        for (let i = 1; i < 5; i++) {
            const nx = pos.x + dx * i;
            const ny = pos.y + dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                winningLine.push({ x: nx, y: ny });
            } else break;
        }

        // Check opposite direction
        for (let i = 1; i < 5; i++) {
            const nx = pos.x - dx * i;
            const ny = pos.y - dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                winningLine.push({ x: nx, y: ny });
            } else break;
        }

        if (winningLine.length >= 5) {
            return { winner: player, line: winningLine };
        }
    }

    return null;
};

export const isBoardFull = (board: BoardState): boolean => {
    return board.every(row => row.every(cell => cell !== null));
};

/**
 * 檢測活三、活四、眠四威脅
 * 活三：_OOO_ (兩端都是空位的三連珠)
 * 活四：_OOOO_ (兩端都是空位的四連珠)
 * 眠四：XOOOO_ 或 _OOOOX (一端被堵住的四連珠)
 * 其他形式：_OO_O_, _O_OO_ 等
 */
export const checkThreats = (board: BoardState, pos: Position): Position[] => {
    const player = board[pos.y][pos.x];
    if (!player) return [];

    const threats: Position[] = [];
    const opponent: Player = player === 'black' ? 'white' : 'black';
    const directions = [
        [1, 0],  // Horizontal
        [0, 1],  // Vertical
        [1, 1],  // Diagonal (down-right)
        [1, -1], // Diagonal (up-right)
    ];

    for (const [dx, dy] of directions) {
        // 收集這個方向上的所有相關位置
        const line: { pos: Position; value: Player | null; isEdge: boolean }[] = [];

        // 向兩個方向延伸最多 5 格（足以檢測活四和眠四）
        for (let i = -5; i <= 5; i++) {
            const nx = pos.x + dx * i;
            const ny = pos.y + dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                line.push({ pos: { x: nx, y: ny }, value: board[ny][nx], isEdge: false });
            } else {
                // 標記邊界
                line.push({ pos: { x: nx, y: ny }, value: null, isEdge: true });
            }
        }

        // 檢測活三、活四、眠四的各種形式
        for (let i = 0; i < line.length; i++) {
            // 檢測活四：_OOOO_
            if (i + 5 < line.length) {
                const segment = line.slice(i, i + 6);
                if (
                    segment[0].value === null &&
                    segment[1].value === player &&
                    segment[2].value === player &&
                    segment[3].value === player &&
                    segment[4].value === player &&
                    segment[5].value === null
                ) {
                    // 找到活四，加入威脅列表
                    for (let j = 1; j <= 4; j++) {
                        const threatPos = segment[j].pos;
                        if (!threats.some(p => p.x === threatPos.x && p.y === threatPos.y)) {
                            threats.push(threatPos);
                        }
                    }
                }
            }

            // 檢測眠四：XOOOO_ (左邊被堵)
            if (i + 4 < line.length) {
                const segment = line.slice(i, i + 5);
                // 左邊被堵：對手棋子或邊界
                const leftBlocked = segment[0].value === opponent || segment[0].isEdge;
                if (
                    leftBlocked &&
                    segment[1].value === player &&
                    segment[2].value === player &&
                    segment[3].value === player &&
                    segment[4].value === player &&
                    i + 5 < line.length &&
                    line[i + 5].value === null
                ) {
                    // 找到眠四（左邊被堵），加入威脅列表
                    for (let j = 1; j <= 4; j++) {
                        const threatPos = segment[j].pos;
                        if (!threats.some(p => p.x === threatPos.x && p.y === threatPos.y)) {
                            threats.push(threatPos);
                        }
                    }
                }
            }

            // 檢測眠四：_OOOOX (右邊被堵)
            if (i + 5 < line.length) {
                const segment = line.slice(i, i + 6);
                // 右邊被堵：對手棋子或邊界
                const rightBlocked = segment[5].value === opponent || segment[5].isEdge;
                if (
                    segment[0].value === null &&
                    segment[1].value === player &&
                    segment[2].value === player &&
                    segment[3].value === player &&
                    segment[4].value === player &&
                    rightBlocked
                ) {
                    // 找到眠四（右邊被堵），加入威脅列表
                    for (let j = 1; j <= 4; j++) {
                        const threatPos = segment[j].pos;
                        if (!threats.some(p => p.x === threatPos.x && p.y === threatPos.y)) {
                            threats.push(threatPos);
                        }
                    }
                }
            }

            // 檢測活三：_OOO_
            if (i + 4 < line.length) {
                const segment = line.slice(i, i + 5);
                if (
                    segment[0].value === null &&
                    segment[1].value === player &&
                    segment[2].value === player &&
                    segment[3].value === player &&
                    segment[4].value === null
                ) {
                    // 找到活三，加入威脅列表
                    for (let j = 1; j <= 3; j++) {
                        const threatPos = segment[j].pos;
                        if (!threats.some(p => p.x === threatPos.x && p.y === threatPos.y)) {
                            threats.push(threatPos);
                        }
                    }
                }
            }

            // 檢測其他形式：_OO_O_ 或 _O_OO_
            if (i + 4 < line.length) {
                const segment = line.slice(i, i + 5);
                // _OO_O_
                if (
                    segment[0].value === null &&
                    segment[1].value === player &&
                    segment[2].value === player &&
                    segment[3].value === null &&
                    segment[4].value === player &&
                    i + 5 < line.length &&
                    line[i + 5].value === null
                ) {
                    for (let j = 1; j <= 4; j++) {
                        if (segment[j].value === player) {
                            const threatPos = segment[j].pos;
                            if (!threats.some(p => p.x === threatPos.x && p.y === threatPos.y)) {
                                threats.push(threatPos);
                            }
                        }
                    }
                }
                // _O_OO_
                if (
                    segment[0].value === null &&
                    segment[1].value === player &&
                    segment[2].value === null &&
                    segment[3].value === player &&
                    segment[4].value === player &&
                    i + 5 < line.length &&
                    line[i + 5].value === null
                ) {
                    for (let j = 1; j <= 4; j++) {
                        if (segment[j].value === player) {
                            const threatPos = segment[j].pos;
                            if (!threats.some(p => p.x === threatPos.x && p.y === threatPos.y)) {
                                threats.push(threatPos);
                            }
                        }
                    }
                }
            }
        }
    }

    return threats;
};
