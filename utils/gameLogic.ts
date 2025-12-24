
import { BoardState, Player, Position } from '../types';

export const BOARD_SIZE = 15;

export const createEmptyBoard = (): BoardState => 
  Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

export const checkWin = (board: BoardState, pos: Position): Player | null => {
  const player = board[pos.y][pos.x];
  if (!player) return null;

  const directions = [
    [1, 0],  // Horizontal
    [0, 1],  // Vertical
    [1, 1],  // Diagonal (down-right)
    [1, -1], // Diagonal (up-right)
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    // Check one direction
    for (let i = 1; i < 5; i++) {
      const nx = pos.x + dx * i;
      const ny = pos.y + dy * i;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
        count++;
      } else break;
    }

    // Check opposite direction
    for (let i = 1; i < 5; i++) {
      const nx = pos.x - dx * i;
      const ny = pos.y - dy * i;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
        count++;
      } else break;
    }

    if (count >= 5) return player;
  }

  return null;
};

export const isBoardFull = (board: BoardState): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};
