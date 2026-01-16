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
