
export type Player = 'black' | 'white';

export interface Position {
  x: number;
  y: number;
}

export type BoardState = (Player | null)[][];

// 遊戲設定
export interface GameSettings {
  undoLimit: number | null;  // null = 無限制, 0 = 不允許, 1-N = 次數
}

// 歷史記錄（用於悔棋）
export interface MoveHistory {
  step: number;
  player: Player;
  position: Position;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  board: BoardState;
  turn: Player;
  winner: Player | 'draw' | null;
  winningLine: Position[] | null;
  lastMove: Position | null;
  players: {
    black?: string;
    white?: string;
  };
  updatedAt: number;
  settings: GameSettings;     // 遊戲設定
  undoCount: {                // 悔棋次數統計
    black: number;
    white: number;
  };
  history: MoveHistory[];     // 歷史記錄
}

// 悔棋請求
export interface UndoRequest {
  requestedBy: Player;
  requestedAt: number;
}

export enum GameMode {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
}
