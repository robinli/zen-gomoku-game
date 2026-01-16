import { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

/**
 * 連線狀態管理 Hook
 * 
 * 管理 Socket 連線狀態和錯誤處理
 */
export function useConnection() {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * 初始化連線
     */
    const connect = () => {
        setIsConnecting(true);
        setError(null);

        socketService.connect();
    };

    /**
     * 斷開連線
     */
    const disconnect = () => {
        socketService.disconnect();
        setIsConnected(false);
        setIsConnecting(false);
        setIsReconnecting(false);
    };

    /**
     * 清除錯誤
     */
    const clearError = () => {
        setError(null);
    };

    /**
     * 設置重連狀態
     */
    const setReconnecting = (reconnecting: boolean) => {
        setIsReconnecting(reconnecting);
    };

    // 監聽連線狀態變化
    useEffect(() => {
        // 連線成功
        const handleConnect = () => {
            setIsConnected(true);
            setIsConnecting(false);
            setIsReconnecting(false);
            setError(null);
        };

        // 連線斷開
        const handleDisconnect = () => {
            setIsConnected(false);
            setIsConnecting(false);
        };

        // 連線錯誤
        const handleConnectError = (err: Error) => {
            setIsConnected(false);
            setIsConnecting(false);
            setIsReconnecting(false);
            setError(err.message || 'Connection error');
        };

        // 重連嘗試
        const handleReconnectAttempt = () => {
            setIsReconnecting(true);
        };

        // 註冊事件監聽器
        socketService.onConnect(handleConnect);
        socketService.onDisconnect(handleDisconnect);
        socketService.onConnectError(handleConnectError);
        socketService.onReconnectAttempt(handleReconnectAttempt);

        // 清理函數
        return () => {
            // Socket.IO 的事件監聽器會在 disconnect 時自動清理
            // 這裡不需要手動移除
        };
    }, []);

    return {
        // 狀態
        isConnected,
        isConnecting,
        isReconnecting,
        error,

        // 方法
        connect,
        disconnect,
        setError,
        clearError,
        setReconnecting,
        setIsConnected,
        setIsConnecting,
    };
}
