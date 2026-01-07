
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
    winningLine: Position[] | null;
    lastMove: Position | null;
    hostSocketId: string;
    guestSocketId: string | null;
    hostSide: Player;
    createdAt: number;
    updatedAt: number;
}

export interface SocketMeta {
    socketId: string;
    roomId: string | null;
    role: 'host' | 'guest' | null;
    side: Player | null;
}

// WebSocket 事件定義
export interface ServerToClientEvents {
    ROOM_CREATED: (data: { roomId: string; shareUrl: string }) => void;
    ROOM_RECONNECTED: (data: { roomId: string; shareUrl: string }) => void;
    ROOM_JOINED: (data: { room: GameRoom; yourSide: Player }) => void;
    GAME_UPDATE: (data: {
        board: BoardState;
        turn: Player;
        winner: Player | 'draw' | null;
        winningLine: Position[] | null;
        lastMove: Position | null;
    }) => void;
    OPPONENT_LEFT: () => void;
    ERROR: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
    CREATE_ROOM: (data: { side: Player }, callback?: (response: any) => void) => void;
    RECONNECT_ROOM: (data: { roomId: string }, callback?: (response: any) => void) => void;
    JOIN_ROOM: (data: { roomId: string }, callback?: (response: any) => void) => void;
    MAKE_MOVE: (data: { x: number; y: number }) => void;
    RESET_GAME: () => void;
}
