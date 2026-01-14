import { GameRoom, Player, UndoRequest, ResetRequest, RoomStats, MoveHistory } from '../types';

/**
 * 遊戲狀態接口
 */
export interface GameState {
    // 房間相關
    room: GameRoom | null;
    localPlayer: Player | null;

    // 連線狀態
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;

    // 錯誤和對話框
    error: string | null;
    showConfirm: boolean;
    showOpponentLeftDialog: boolean;
    messageDialog: {
        title: string;
        message: string;
        icon: 'success' | 'error' | 'info';
    } | null;

    // 請求狀態
    undoRequest: UndoRequest | null;
    isWaitingUndo: boolean;
    resetRequest: ResetRequest | null;
    isWaitingReset: boolean;

    // 統計
    roomStats: RoomStats;

    // 回放
    isReplaying: boolean;
    replayStep: number;
    isAutoPlaying: boolean;
    replayHistory: MoveHistory[];
}

/**
 * 遊戲動作類型
 */
export type GameAction =
    // 房間相關
    | { type: 'SET_ROOM'; payload: GameRoom | null }
    | { type: 'UPDATE_ROOM'; payload: Partial<GameRoom> }
    | { type: 'SET_LOCAL_PLAYER'; payload: Player | null }

    // 連線狀態
    | { type: 'SET_CONNECTED'; payload: boolean }
    | { type: 'SET_CONNECTING'; payload: boolean }
    | { type: 'SET_RECONNECTING'; payload: boolean }

    // 錯誤和對話框
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SHOW_CONFIRM'; payload: boolean }
    | { type: 'SET_SHOW_OPPONENT_LEFT_DIALOG'; payload: boolean }
    | { type: 'SET_MESSAGE_DIALOG'; payload: GameState['messageDialog'] }

    // 請求狀態
    | { type: 'SET_UNDO_REQUEST'; payload: UndoRequest | null }
    | { type: 'SET_WAITING_UNDO'; payload: boolean }
    | { type: 'SET_RESET_REQUEST'; payload: ResetRequest | null }
    | { type: 'SET_WAITING_RESET'; payload: boolean }

    // 統計
    | { type: 'UPDATE_STATS'; payload: { winner: Player | 'draw' } }
    | { type: 'RESET_STATS' }

    // 回放
    | { type: 'START_REPLAY'; payload: MoveHistory[] }
    | { type: 'EXIT_REPLAY' }
    | { type: 'SET_REPLAY_STEP'; payload: number }
    | { type: 'SET_AUTO_PLAYING'; payload: boolean }
    | { type: 'REPLAY_NEXT' }
    | { type: 'REPLAY_PREVIOUS' }
    | { type: 'REPLAY_RESTART' };

/**
 * 初始狀態
 */
export const initialGameState: GameState = {
    room: null,
    localPlayer: null,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    error: null,
    showConfirm: false,
    showOpponentLeftDialog: false,
    messageDialog: null,
    undoRequest: null,
    isWaitingUndo: false,
    resetRequest: null,
    isWaitingReset: false,
    roomStats: {
        black: { wins: 0, losses: 0, draws: 0 },
        white: { wins: 0, losses: 0, draws: 0 }
    },
    isReplaying: false,
    replayStep: 0,
    isAutoPlaying: false,
    replayHistory: [],
};

/**
 * 更新統計的輔助函數
 */
function updateStatsForWinner(stats: RoomStats, winner: Player | 'draw'): RoomStats {
    const newStats = {
        black: { ...stats.black },
        white: { ...stats.white }
    };

    if (winner === 'draw') {
        newStats.black.draws++;
        newStats.white.draws++;
    } else {
        const loser: Player = winner === 'black' ? 'white' : 'black';
        newStats[winner].wins++;
        newStats[loser].losses++;
    }

    return newStats;
}

/**
 * 遊戲狀態 Reducer
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        // 房間相關
        case 'SET_ROOM':
            return { ...state, room: action.payload };

        case 'UPDATE_ROOM':
            if (!state.room) return state;
            return {
                ...state,
                room: {
                    ...state.room,
                    ...action.payload,
                    updatedAt: Date.now()
                }
            };

        case 'SET_LOCAL_PLAYER':
            return { ...state, localPlayer: action.payload };

        // 連線狀態
        case 'SET_CONNECTED':
            return { ...state, isConnected: action.payload };

        case 'SET_CONNECTING':
            return { ...state, isConnecting: action.payload };

        case 'SET_RECONNECTING':
            return { ...state, isReconnecting: action.payload };

        // 錯誤和對話框
        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'SET_SHOW_CONFIRM':
            return { ...state, showConfirm: action.payload };

        case 'SET_SHOW_OPPONENT_LEFT_DIALOG':
            return { ...state, showOpponentLeftDialog: action.payload };

        case 'SET_MESSAGE_DIALOG':
            return { ...state, messageDialog: action.payload };

        // 請求狀態
        case 'SET_UNDO_REQUEST':
            return { ...state, undoRequest: action.payload };

        case 'SET_WAITING_UNDO':
            return { ...state, isWaitingUndo: action.payload };

        case 'SET_RESET_REQUEST':
            return { ...state, resetRequest: action.payload };

        case 'SET_WAITING_RESET':
            return { ...state, isWaitingReset: action.payload };

        // 統計
        case 'UPDATE_STATS':
            return {
                ...state,
                roomStats: updateStatsForWinner(state.roomStats, action.payload.winner)
            };

        case 'RESET_STATS':
            return {
                ...state,
                roomStats: {
                    black: { wins: 0, losses: 0, draws: 0 },
                    white: { wins: 0, losses: 0, draws: 0 }
                }
            };

        // 回放
        case 'START_REPLAY':
            return {
                ...state,
                isReplaying: true,
                replayStep: 0,
                isAutoPlaying: true,
                replayHistory: action.payload
            };

        case 'EXIT_REPLAY':
            return {
                ...state,
                isReplaying: false,
                replayStep: 0,
                isAutoPlaying: false,
                replayHistory: []
            };

        case 'SET_REPLAY_STEP':
            return { ...state, replayStep: action.payload };

        case 'SET_AUTO_PLAYING':
            return { ...state, isAutoPlaying: action.payload };

        case 'REPLAY_NEXT':
            if (state.replayStep < state.replayHistory.length - 1) {
                return { ...state, replayStep: state.replayStep + 1 };
            }
            return state;

        case 'REPLAY_PREVIOUS':
            if (state.replayStep > 0) {
                return { ...state, replayStep: state.replayStep - 1 };
            }
            return state;

        case 'REPLAY_RESTART':
            return {
                ...state,
                replayStep: 0,
                isAutoPlaying: false
            };

        default:
            return state;
    }
}
