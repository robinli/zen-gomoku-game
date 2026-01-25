
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
    hostSocketId: string;
    guestSocketId: string | null;
    hostSide: Player;
    createdAt: number;
    updatedAt: number;
    settings: GameSettings;     // 遊戲設定
    undoCount: {                // 悔棋次數統計
        black: number;
        white: number;
    };
    history: MoveHistory[];     // 歷史記錄
    playerNames: {             // 玩家名稱 (用於已登入用戶)
        black?: string;
        white?: string;
    };
}

export interface SocketMeta {
    socketId: string;
    roomId: string | null;
    role: 'host' | 'guest' | null;
    side: Player | null;
}

// WebSocket 事件定義
export interface ServerToClientEvents {
    ROOM_CREATED: (data: { roomId: string; shareUrl: string; settings: GameSettings }) => void;
    ROOM_RECONNECTED: (data: { roomId: string; shareUrl: string; room: GameRoom }) => void;
    ROOM_JOINED: (data: { room: GameRoom; yourSide: Player }) => void;
    GAME_UPDATE: (data: {
        board: BoardState;
        turn: Player;
        winner: Player | 'draw' | null;
        winningLine: Position[] | null;
        threatLine?: Position[] | null;  // 威脅棋子位置（活三、活四）
        lastMove: Position | null;
    }) => void;
    OPPONENT_LEFT: () => void;
    ERROR: (data: { message: string }) => void;


    // 悔棋相關事件
    UNDO_REQUESTED: (data: { requestedBy: Player }) => void;
    UNDO_ACCEPTED: (data: {
        board: BoardState;
        turn: Player;
        lastMove: Position | null;
        undoCount: { black: number; white: number };
    }) => void;
    UNDO_REJECTED: () => void;

    // 重置請求相關事件
    RESET_REQUESTED: (data: { requestedBy: Player }) => void;
    RESET_ACCEPTED: () => void;
    RESET_REJECTED: () => void;
}

export interface ClientToServerEvents {
    CREATE_ROOM: (data: { side: Player; settings?: GameSettings; userName?: string }, callback?: (response: any) => void) => void;
    RECONNECT_ROOM: (data: { roomId: string }, callback?: (response: any) => void) => void;
    JOIN_ROOM: (data: { roomId: string; userName?: string }, callback?: (response: any) => void) => void;
    MAKE_MOVE: (data: { x: number; y: number }) => void;
    RESET_GAME: () => void;

    // 悔棋相關事件
    REQUEST_UNDO: () => void;
    RESPOND_UNDO: (data: { accept: boolean }) => void;

    // 重置請求相關事件
    REQUEST_RESET: () => void;
    RESPOND_RESET: (data: { accept: boolean }) => void;

    // 主動離開房間
    LEAVE_ROOM: () => void;
}
