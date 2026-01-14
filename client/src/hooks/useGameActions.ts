import { useTranslation } from 'react-i18next';
import { GameRoom, Player, Position } from '../types';

/**
 * 遊戲動作 Hook
 * 
 * 管理所有遊戲動作邏輯，包括下棋、悔棋、重置
 */
export function useGameActions(
    room: GameRoom | null,
    localPlayer: Player | null,
    socketService: any,
    isProcessingMove: React.MutableRefObject<boolean>,
    callbacks: {
        setError: (error: string | null) => void;
        setRoom: React.Dispatch<React.SetStateAction<GameRoom | null>>;
        setMessageDialog: (dialog: { title: string; message: string; icon: 'success' | 'error' | 'info' } | null) => void;
        setIsWaitingUndo: (waiting: boolean) => void;
        setUndoRequest: (request: any) => void;
        setIsWaitingReset: (waiting: boolean) => void;
        setResetRequest: (request: any) => void;
    }
) {
    const { t } = useTranslation();

    /**
     * 處理下棋
     */
    const handleMove = (pos: Position) => {
        if (!room || !localPlayer) return;
        if (room.winner) return;
        if (room.turn !== localPlayer) return;
        if (room.board[pos.y][pos.x]) return;

        if (!socketService.isConnected()) {
            callbacks.setError(t('app.connection_lost_refresh'));
            return;
        }

        isProcessingMove.current = true;

        // 樂觀更新 UI（立即顯示自己的落子）
        const newBoard = room.board.map(row => [...row]);
        newBoard[pos.y][pos.x] = localPlayer;

        callbacks.setRoom(prev => prev ? {
            ...prev,
            board: newBoard,
            lastMove: pos,
            updatedAt: Date.now()
        } : null);

        // 發送給 Server
        socketService.makeMove(pos.x, pos.y);
    };

    /**
     * 請求悔棋
     */
    const handleRequestUndo = () => {
        if (!room || !localPlayer) return;

        // 檢查是否允許悔棋
        if (room.settings.undoLimit === 0) {
            callbacks.setMessageDialog({
                title: t('app.cannot_undo_title'),
                message: t('app.cannot_undo_not_allowed'),
                icon: 'info'
            });
            return;
        }

        // 檢查次數
        if (room.settings.undoLimit !== null) {
            const used = room.undoCount[localPlayer];
            if (used >= room.settings.undoLimit) {
                callbacks.setMessageDialog({
                    title: t('app.cannot_undo_title'),
                    message: t('app.cannot_undo_limit', { used, limit: room.settings.undoLimit }),
                    icon: 'info'
                });
                return;
            }
        }

        // 檢查是否有歷史記錄
        if (!room.history || room.history.length === 0) {
            callbacks.setMessageDialog({
                title: t('app.cannot_undo_title'),
                message: t('app.cannot_undo_no_steps'),
                icon: 'info'
            });
            return;
        }

        // 檢查最後一步是否是自己下的
        const lastMove = room.history[room.history.length - 1];
        if (lastMove.player !== localPlayer) {
            callbacks.setMessageDialog({
                title: t('app.cannot_undo_title'),
                message: t('app.cannot_undo_only_own'),
                icon: 'info'
            });
            return;
        }

        console.log(t('message.request_undo_log'));
        callbacks.setIsWaitingUndo(true);
        socketService.requestUndo();
    };

    /**
     * 回應悔棋請求
     */
    const handleRespondUndo = (accept: boolean) => {
        console.log(t('message.respond_undo_log', { accept: accept ? t('dialog.agree') : t('dialog.reject') }));
        socketService.respondUndo(accept);
        callbacks.setUndoRequest(null);
    };

    /**
     * 請求重新開始
     */
    const handleRequestReset = () => {
        if (!room || !localPlayer) return;

        console.log(t('message.request_reset_log'));
        callbacks.setIsWaitingReset(true);
        socketService.requestReset();
    };

    /**
     * 回應重置請求
     */
    const handleRespondReset = (accept: boolean) => {
        console.log(t('message.respond_reset_log', { accept: accept ? t('dialog.agree') : t('dialog.reject') }));
        socketService.respondReset(accept);
        callbacks.setResetRequest(null);
    };

    return {
        handleMove,
        handleRequestUndo,
        handleRespondUndo,
        handleRequestReset,
        handleRespondReset,
    };
}
