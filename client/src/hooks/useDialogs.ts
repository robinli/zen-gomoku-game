import { useState } from 'react';
import { UndoRequest, ResetRequest } from '../types';

/**
 * 對話框狀態管理 Hook
 * 
 * 管理應用中所有對話框的狀態
 */
export function useDialogs() {
    // 悔棋請求對話框
    const [undoRequest, setUndoRequest] = useState<UndoRequest | null>(null);

    // 重置請求對話框
    const [resetRequest, setResetRequest] = useState<ResetRequest | null>(null);

    // 訊息對話框
    const [messageDialog, setMessageDialog] = useState<{
        title: string;
        message: string;
        icon: 'success' | 'error' | 'info';
    } | null>(null);

    // 對手離開對話框
    const [showOpponentLeftDialog, setShowOpponentLeftDialog] = useState(false);

    // 確認離開對話框
    const [showConfirm, setShowConfirm] = useState(false);

    /**
     * 顯示成功訊息
     */
    const showSuccess = (title: string, message: string) => {
        setMessageDialog({ title, message, icon: 'success' });
    };

    /**
     * 顯示錯誤訊息
     */
    const showError = (title: string, message: string) => {
        setMessageDialog({ title, message, icon: 'error' });
    };

    /**
     * 顯示資訊訊息
     */
    const showInfo = (title: string, message: string) => {
        setMessageDialog({ title, message, icon: 'info' });
    };

    /**
     * 關閉訊息對話框
     */
    const closeMessageDialog = () => {
        setMessageDialog(null);
    };

    /**
     * 關閉所有對話框
     */
    const closeAllDialogs = () => {
        setUndoRequest(null);
        setResetRequest(null);
        setMessageDialog(null);
        setShowOpponentLeftDialog(false);
        setShowConfirm(false);
    };

    return {
        // 狀態
        undoRequest,
        resetRequest,
        messageDialog,
        showOpponentLeftDialog,
        showConfirm,

        // Setters
        setUndoRequest,
        setResetRequest,
        setMessageDialog,
        setShowOpponentLeftDialog,
        setShowConfirm,

        // 輔助方法
        showSuccess,
        showError,
        showInfo,
        closeMessageDialog,
        closeAllDialogs,
    };
}
