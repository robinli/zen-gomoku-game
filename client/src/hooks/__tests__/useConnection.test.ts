import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnection } from '../useConnection';
import { socketService } from '../../services/socketService';

// Mock socketService
vi.mock('../../services/socketService', () => ({
    socketService: {
        connect: vi.fn(),
        disconnect: vi.fn(),
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onConnectError: vi.fn(),
        onReconnectAttempt: vi.fn(),
    },
}));

describe('useConnection', () => {
    let connectCallback: () => void;
    let disconnectCallback: () => void;
    let connectErrorCallback: (err: Error) => void;
    let reconnectAttemptCallback: () => void;

    beforeEach(() => {
        // 捕獲事件回調
        vi.mocked(socketService.onConnect).mockImplementation((cb) => {
            connectCallback = cb;
        });
        vi.mocked(socketService.onDisconnect).mockImplementation((cb) => {
            disconnectCallback = cb;
        });
        vi.mocked(socketService.onConnectError).mockImplementation((cb) => {
            connectErrorCallback = cb;
        });
        vi.mocked(socketService.onReconnectAttempt).mockImplementation((cb) => {
            reconnectAttemptCallback = cb;
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('初始化', () => {
        it('應該有正確的初始狀態', () => {
            const { result } = renderHook(() => useConnection());

            expect(result.current.isConnected).toBe(false);
            expect(result.current.isConnecting).toBe(false);
            expect(result.current.isReconnecting).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('應該註冊事件監聽器', () => {
            renderHook(() => useConnection());

            expect(socketService.onConnect).toHaveBeenCalled();
            expect(socketService.onDisconnect).toHaveBeenCalled();
            expect(socketService.onConnectError).toHaveBeenCalled();
            expect(socketService.onReconnectAttempt).toHaveBeenCalled();
        });
    });

    describe('connect', () => {
        it('應該調用 socketService.connect', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.connect();
            });

            expect(socketService.connect).toHaveBeenCalled();
        });

        it('應該設置 isConnecting 為 true', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.connect();
            });

            expect(result.current.isConnecting).toBe(true);
        });

        it('應該清除錯誤', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.setError('Test error');
            });

            act(() => {
                result.current.connect();
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('disconnect', () => {
        it('應該調用 socketService.disconnect', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.disconnect();
            });

            expect(socketService.disconnect).toHaveBeenCalled();
        });

        it('應該重置所有連線狀態', () => {
            const { result } = renderHook(() => useConnection());

            // 設置一些狀態
            act(() => {
                result.current.setIsConnected(true);
                result.current.setIsConnecting(true);
                result.current.setReconnecting(true);
            });

            act(() => {
                result.current.disconnect();
            });

            expect(result.current.isConnected).toBe(false);
            expect(result.current.isConnecting).toBe(false);
            expect(result.current.isReconnecting).toBe(false);
        });
    });

    describe('事件處理', () => {
        it('連線成功時應該更新狀態', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.connect();
            });

            act(() => {
                connectCallback();
            });

            expect(result.current.isConnected).toBe(true);
            expect(result.current.isConnecting).toBe(false);
            expect(result.current.isReconnecting).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('斷線時應該更新狀態', () => {
            const { result } = renderHook(() => useConnection());

            // 先連線
            act(() => {
                connectCallback();
            });

            // 然後斷線
            act(() => {
                disconnectCallback();
            });

            expect(result.current.isConnected).toBe(false);
            expect(result.current.isConnecting).toBe(false);
        });

        it('連線錯誤時應該設置錯誤訊息', () => {
            const { result } = renderHook(() => useConnection());

            const error = new Error('Connection failed');

            act(() => {
                connectErrorCallback(error);
            });

            expect(result.current.isConnected).toBe(false);
            expect(result.current.isConnecting).toBe(false);
            expect(result.current.isReconnecting).toBe(false);
            expect(result.current.error).toBe('Connection failed');
        });

        it('重連嘗試時應該設置重連狀態', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                reconnectAttemptCallback();
            });

            expect(result.current.isReconnecting).toBe(true);
        });
    });

    describe('錯誤處理', () => {
        it('應該能設置錯誤', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.setError('Test error');
            });

            expect(result.current.error).toBe('Test error');
        });

        it('應該能清除錯誤', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.setError('Test error');
            });

            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
        });

        it('連線錯誤沒有訊息時應該使用默認訊息', () => {
            const { result } = renderHook(() => useConnection());

            const error = new Error();

            act(() => {
                connectErrorCallback(error);
            });

            expect(result.current.error).toBe('Connection error');
        });
    });

    describe('手動狀態設置', () => {
        it('應該能手動設置 isConnected', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.setIsConnected(true);
            });

            expect(result.current.isConnected).toBe(true);
        });

        it('應該能手動設置 isConnecting', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.setIsConnecting(true);
            });

            expect(result.current.isConnecting).toBe(true);
        });

        it('應該能手動設置 isReconnecting', () => {
            const { result } = renderHook(() => useConnection());

            act(() => {
                result.current.setReconnecting(true);
            });

            expect(result.current.isReconnecting).toBe(true);
        });
    });
});
