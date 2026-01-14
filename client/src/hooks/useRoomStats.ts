import { useReducer, useRef, useEffect } from 'react';
import { Player, RoomStats } from '../types';

/**
 * 房間統計 Action
 */
type StatsAction =
    | { type: 'UPDATE_STATS'; payload: { winner: Player | 'draw' } }
    | { type: 'RESET_STATS' };

/**
 * 房間統計 Reducer
 */
function statsReducer(state: RoomStats, action: StatsAction): RoomStats {
    switch (action.type) {
        case 'UPDATE_STATS': {
            const { winner } = action.payload;
            const newStats = {
                black: { ...state.black },
                white: { ...state.white }
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

        case 'RESET_STATS':
            return {
                black: { wins: 0, losses: 0, draws: 0 },
                white: { wins: 0, losses: 0, draws: 0 }
            };

        default:
            return state;
    }
}

/**
 * 初始統計狀態
 */
const initialStats: RoomStats = {
    black: { wins: 0, losses: 0, draws: 0 },
    white: { wins: 0, losses: 0, draws: 0 }
};

/**
 * 房間統計 Hook
 * 
 * 使用 useReducer 統一管理統計狀態，解決 ref/state 同步問題
 */
export function useRoomStats() {
    const [roomStats, dispatch] = useReducer(statsReducer, initialStats);
    const lastWinnerRef = useRef<Player | 'draw' | null>(null);

    /**
     * 更新統計
     */
    const updateStats = (winner: Player | 'draw') => {
        // 避免重複更新同一個勝者
        if (winner !== lastWinnerRef.current) {
            console.log('📊 更新統計:', { winner, timestamp: Date.now() });
            lastWinnerRef.current = winner;
            dispatch({ type: 'UPDATE_STATS', payload: { winner } });
        }
    };

    /**
     * 重置統計
     */
    const resetStats = () => {
        console.log('📊 重置統計');
        lastWinnerRef.current = null;
        dispatch({ type: 'RESET_STATS' });
    };

    /**
     * 清除勝者記錄（用於遊戲重置時）
     */
    const clearWinnerRef = () => {
        lastWinnerRef.current = null;
    };

    return {
        roomStats,
        updateStats,
        resetStats,
        clearWinnerRef,
    };
}
