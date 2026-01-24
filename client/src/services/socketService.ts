
// 使用全域的 Socket.IO (從 CDN 載入)
declare const io: any;

import type { GameRoom, Player, Position, GameSettings, BoardState } from '../types';

class SocketService {
    private socket: any = null;
    private serverUrl: string;
    private authToken: string | null = null;

    constructor() {
        // 從環境變數讀取 Server URL，開發環境預設為 localhost:3000
        this.serverUrl = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:3000';
        console.log('🏗️ SocketService 已創建，Server URL:', this.serverUrl);
    }

    // 設置認證 Token
    setAuthToken(token: string): void {
        this.authToken = token;
        console.log('🔑 已設置認證 Token');
    }

    // 連線到 Server
    connect(): any {
        if (typeof io === 'undefined') {
            console.error('❌ Socket.IO 未載入！請確保 CDN 腳本已載入');
            return null;
        }

        if (this.socket?.connected) {
            console.log('✅ Socket 已連線，Socket ID:', this.socket.id);
            return this.socket;
        }

        console.log('🔗 開始連線到:', this.serverUrl);

        try {
            this.socket = io(this.serverUrl, {
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                auth: {
                    token: this.authToken
                }
            });

            // 立即設置事件監聽
            this.socket.on('connect', () => {
                console.log('🔌 Socket 連線成功！ID:', this.socket.id);
            });

            this.socket.on('disconnect', (reason: any) => {
                console.log('🔌 Socket 已斷線:', reason);
            });

            this.socket.on('connect_error', (error: any) => {
                console.error('❌ Socket 連線錯誤:', error.message);
            });

            return this.socket;
        } catch (error) {
            console.error('❌ 創建 Socket 時發生錯誤:', error);
            return null;
        }
    }

    // 斷線
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('🔌 Socket 已主動斷線');
        }
    }

    // 創建房間
    createRoom(
        side: Player,
        settings: GameSettings,
        callback: (data: { roomId: string; shareUrl: string; settings: GameSettings }) => void
    ): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 CREATE_ROOM 事件, side:', side, 'settings:', settings);

        this.socket.emit('CREATE_ROOM', { side, settings }, (response: any) => {
            console.log('📥 收到 CREATE_ROOM 回應:', response);
            if (response && response.success) {
                callback({
                    roomId: response.roomId,
                    shareUrl: response.shareUrl,
                    settings: response.settings
                });
            }
        });

        this.socket.on('ROOM_CREATED', (data: { roomId: string; shareUrl: string; settings: GameSettings }) => {
            console.log('📥 收到 ROOM_CREATED 事件:', data);
            callback(data);
        });
    }

    // 重新連線到房間
    reconnectRoom(roomId: string, callback: (data: { success: boolean; roomId?: string; shareUrl?: string; error?: string }) => void): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            callback({ success: false, error: 'Socket 未初始化' });
            return;
        }

        console.log('📤 發送 RECONNECT_ROOM 事件, roomId:', roomId);

        this.socket.emit('RECONNECT_ROOM', { roomId }, (response: any) => {
            console.log('📥 收到 RECONNECT_ROOM 回應:', response);
            if (response) {
                callback(response);
            }
        });

        // 監聽重連成功事件
        this.socket.once('ROOM_RECONNECTED', (data: { roomId: string; shareUrl: string }) => {
            console.log('📥 收到 ROOM_RECONNECTED 事件:', data);
            callback({ success: true, ...data });
        });
    }

    // 加入房間
    joinRoom(roomId: string, callback: (data: { room: GameRoom; yourSide: Player }) => void): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 JOIN_ROOM 事件, roomId:', roomId);

        // 使用 once 避免重複監聽
        const onRoomJoined = (data: { room: GameRoom; yourSide: Player }) => {
            console.log('📥 收到 ROOM_JOINED 事件:', data);
            this.socket.off('ERROR', onError);  // 移除錯誤監聽
            callback(data);
        };

        const onError = (data: { message: string }) => {
            console.error('❌ 加入房間失敗:', data.message);
            this.socket.off('ROOM_JOINED', onRoomJoined);  // 移除成功監聽
            // 通過設置全局錯誤來觸發 UI 顯示錯誤
        };

        this.socket.once('ROOM_JOINED', onRoomJoined);
        this.socket.once('ERROR', onError);

        this.socket.emit('JOIN_ROOM', { roomId });
    }

    // 落子
    makeMove(x: number, y: number): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 MAKE_MOVE 事件, 位置:', x, y);
        this.socket.emit('MAKE_MOVE', { x, y });
    }

    // 監聽遊戲更新
    onGameUpdate(callback: (data: any) => void): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        this.socket.on('GAME_UPDATE', (data: any) => {
            console.log('📥 收到 GAME_UPDATE 事件:', data);
            callback(data);
        });
    }

    // 重新開始
    resetGame(): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 RESET_GAME 事件');
        this.socket.emit('RESET_GAME');
    }

    // 主動離開房間
    leaveRoom(): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 LEAVE_ROOM 事件');
        this.socket.emit('LEAVE_ROOM');
    }

    // 監聽連線成功
    onConnect(callback: () => void): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        this.socket.on('connect', () => {
            console.log('📥 觸發 connect 事件回調');
            callback();
        });
    }

    // 監聽連線錯誤
    onConnectError(callback: (error: Error) => void): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        this.socket.on('connect_error', (error: Error) => {
            console.log('📥 觸發 connect_error 事件回調:', error);
            callback(error);
        });
    }

    // 監聽對手離開
    onOpponentLeft(callback: () => void): void {
        if (!this.socket) return;
        this.socket.on('OPPONENT_LEFT', callback);
    }

    // 監聽錯誤
    onError(callback: (data: { message: string }) => void): void {
        if (!this.socket) return;
        this.socket.on('ERROR', callback);
    }

    // 監聽房間加入（用於房主收到對手加入的通知）
    onRoomJoined(callback: (data: { room: GameRoom; yourSide: Player }) => void): void {
        if (!this.socket) return;
        this.socket.on('ROOM_JOINED', (data: { room: GameRoom; yourSide: Player }) => {
            console.log('📥 收到 ROOM_JOINED 全局事件:', data);
            callback(data);
        });
    }

    // 移除所有事件監聽器
    removeAllListeners(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }

    // 檢查連線狀態
    isConnected(): boolean {
        const connected = this.socket?.connected ?? false;
        console.log('🔍 檢查連線狀態:', connected, 'Socket ID:', this.socket?.id);
        return connected;
    }

    // 取得 Socket 實例（用於調試）
    getSocket(): any {
        return this.socket;
    }

    // ========== 悔棋相關方法 ==========

    // 請求悔棋
    requestUndo(): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 REQUEST_UNDO 事件');
        this.socket.emit('REQUEST_UNDO');
    }

    // 回應悔棋請求
    respondUndo(accept: boolean): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 RESPOND_UNDO 事件, accept:', accept);
        this.socket.emit('RESPOND_UNDO', { accept });
    }

    // 監聽悔棋請求
    onUndoRequested(callback: (data: { requestedBy: Player }) => void): void {
        if (!this.socket) return;

        this.socket.on('UNDO_REQUESTED', (data: { requestedBy: Player }) => {
            console.log('📥 收到 UNDO_REQUESTED 事件:', data);
            callback(data);
        });
    }

    // 監聽悔棋成功
    onUndoAccepted(callback: (data: {
        board: BoardState;
        turn: Player;
        lastMove: Position | null;
        undoCount: { black: number; white: number };
    }) => void): void {
        if (!this.socket) return;

        this.socket.on('UNDO_ACCEPTED', (data: {
            board: BoardState;
            turn: Player;
            lastMove: Position | null;
            undoCount: { black: number; white: number };
        }) => {
            console.log('📥 收到 UNDO_ACCEPTED 事件:', data);
            callback(data);
        });
    }

    // 監聽悔棋被拒絕
    onUndoRejected(callback: () => void): void {
        if (!this.socket) return;

        this.socket.on('UNDO_REJECTED', () => {
            console.log('📥 收到 UNDO_REJECTED 事件');
            callback();
        });
    }

    // 移除悔棋事件監聽器
    offUndoEvents(): void {
        if (!this.socket) return;

        this.socket.off('UNDO_REQUESTED');
        this.socket.off('UNDO_ACCEPTED');
        this.socket.off('UNDO_REJECTED');
        console.log('🔇 已移除悔棋事件監聽器');
    }

    // ========== 重置請求相關方法 ==========

    // 請求重新開始
    requestReset(): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 REQUEST_RESET 事件');
        this.socket.emit('REQUEST_RESET');
    }

    // 回應重置請求
    respondReset(accept: boolean): void {
        if (!this.socket) {
            console.error('❌ Socket 未初始化');
            return;
        }

        console.log('📤 發送 RESPOND_RESET 事件, accept:', accept);
        this.socket.emit('RESPOND_RESET', { accept });
    }

    // 監聽重置請求
    onResetRequested(callback: (data: { requestedBy: Player }) => void): void {
        if (!this.socket) return;

        this.socket.on('RESET_REQUESTED', (data: { requestedBy: Player }) => {
            console.log('📥 收到 RESET_REQUESTED 事件:', data);
            callback(data);
        });
    }

    // 監聽重置成功
    onResetAccepted(callback: () => void): void {
        if (!this.socket) return;

        this.socket.on('RESET_ACCEPTED', () => {
            console.log('📥 收到 RESET_ACCEPTED 事件');
            callback();
        });
    }

    // 監聽重置被拒絕
    onResetRejected(callback: () => void): void {
        if (!this.socket) return;

        this.socket.on('RESET_REJECTED', () => {
            console.log('📥 收到 RESET_REJECTED 事件');
            callback();
        });
    }

    // 移除重置事件監聽器
    offResetEvents(): void {
        if (!this.socket) return;

        this.socket.off('RESET_REQUESTED');
        this.socket.off('RESET_ACCEPTED');
        this.socket.off('RESET_REJECTED');
        console.log('🔇 已移除重置事件監聽器');
    }
}

// 單例模式
export const socketService = new SocketService();

// 暴露到 window 用於調試
if (typeof window !== 'undefined') {
    (window as any).socketService = socketService;
}
