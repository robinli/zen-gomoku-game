
export type Player = 'black' | 'white';

export interface Position {
  x: number;
  y: number;
}

export type BoardState = (Player | null)[][];

export interface GameRoom {
  id: string;
  board: BoardState;
  turn: Player;
  winner: Player | 'draw' | null;
  lastMove: Position | null;
  players: {
    black?: string;
    white?: string;
  };
  updatedAt: number;
}

export enum GameMode {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
}
