import { useState, useRef, useEffect } from 'react';
import { BoardState, MoveHistory } from '../types';
import { REPLAY_CONFIG, BOARD_CONFIG } from '../config/constants';

/**
 * 回放 Hook
 * 
 * 管理遊戲回放功能，包括播放控制、步驟導航和自動播放
 */
export function useReplay() {
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayStep, setReplayStep] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [replayHistory, setReplayHistory] = useState<MoveHistory[]>([]);
    const autoPlayTimer = useRef<number | null>(null);

    /**
     * 根據步驟重建棋盤狀態
     */
    const getReplayBoard = (step: number): BoardState => {
        const board: BoardState = Array(BOARD_CONFIG.SIZE)
            .fill(null)
            .map(() => Array(BOARD_CONFIG.SIZE).fill(null));

        for (let i = 0; i <= step && i < replayHistory.length; i++) {
            const move = replayHistory[i];
            board[move.position.y][move.position.x] = move.player;
        }

        return board;
    };

    /**
     * 開始回放
     */
    const startReplay = (history: MoveHistory[]) => {
        if (!history || history.length === 0) return;

        console.log('🎬 開始回放，共', history.length, '步');
        setReplayHistory([...history]); // 建立快照
        setIsReplaying(true);
        setReplayStep(0);
        setIsAutoPlaying(true); // 自動開始播放
    };

    /**
     * 退出回放
     */
    const exitReplay = () => {
        console.log('🛑 退出回放');
        setIsReplaying(false);
        setReplayStep(0);
        setIsAutoPlaying(false);
        setReplayHistory([]);

        if (autoPlayTimer.current) {
            clearInterval(autoPlayTimer.current);
            autoPlayTimer.current = null;
        }
    };

    /**
     * 上一步
     */
    const previousStep = () => {
        if (replayStep > 0) {
            setReplayStep(prev => prev - 1);
        }
    };

    /**
     * 下一步
     */
    const nextStep = () => {
        if (replayStep < replayHistory.length - 1) {
            setReplayStep(prev => prev + 1);
        }
    };

    /**
     * 重新開始回放
     */
    const restartReplay = () => {
        setReplayStep(0);
        setIsAutoPlaying(false);
    };

    /**
     * 切換自動播放
     */
    const toggleAutoPlay = () => {
        setIsAutoPlaying(prev => !prev);
    };

    /**
     * 快進到最後
     */
    const fastForward = () => {
        if (replayHistory.length > 0) {
            setReplayStep(replayHistory.length - 1);
        }
    };

    /**
     * 自動播放效果
     */
    useEffect(() => {
        if (isAutoPlaying && isReplaying) {
            autoPlayTimer.current = window.setInterval(() => {
                setReplayStep(prev => {
                    if (prev >= replayHistory.length - 1) {
                        setIsAutoPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, REPLAY_CONFIG.AUTO_PLAY_INTERVAL_MS);

            return () => {
                if (autoPlayTimer.current) {
                    clearInterval(autoPlayTimer.current);
                    autoPlayTimer.current = null;
                }
            };
        }
    }, [isAutoPlaying, isReplaying, replayHistory.length]);

    /**
     * 清理定時器
     */
    useEffect(() => {
        return () => {
            if (autoPlayTimer.current) {
                clearInterval(autoPlayTimer.current);
            }
        };
    }, []);

    return {
        // 狀態
        isReplaying,
        replayStep,
        isAutoPlaying,
        replayHistory,

        // 方法
        getReplayBoard,
        startReplay,
        exitReplay,
        previousStep,
        nextStep,
        restartReplay,
        toggleAutoPlay,
        fastForward,
    };
}
