
import { BoardState, Player, Position } from '../types';
import { BOARD_CONFIG } from '../config/constants';

export const BOARD_SIZE = BOARD_CONFIG.SIZE;

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
