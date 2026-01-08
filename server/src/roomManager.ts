
import { GameRoom, Player, GameSettings } from './types.js';
import { createEmptyBoard } from './gameLogic.js';

// 擴展 GameRoom 類型以支援斷線寬限期
interface ExtendedGameRoom extends GameRoom {
    hostDisconnectedAt?: number;      // 房主斷線時間戳
    deletionTimer?: NodeJS.Timeout;   // 刪除計時器
}

class RoomManager {
    private rooms: Map<string, ExtendedGameRoom> = new Map();
    private readonly GRACE_PERIOD = 30 * 1000; // 30 秒寬限期

    // 產生 6 位大寫房間 ID
    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 創建房間
    createRoom(hostSocketId: string, hostSide: Player, settings?: GameSettings): GameRoom {
        const roomId = this.generateRoomId();

        // 預設設定：允許悔棋 3 次
        const defaultSettings: GameSettings = {
            undoLimit: 3,
        };

        const room: ExtendedGameRoom = {
            id: roomId,
            board: createEmptyBoard(),
            turn: 'black',
            winner: null,
            winningLine: null,
            lastMove: null,
            hostSocketId,
            guestSocketId: null,
            hostSide,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            settings: settings || defaultSettings,  // 使用傳入的設定或預設值
            undoCount: {                            // 初始化悔棋次數
                black: 0,
                white: 0,
            },
            history: [],                            // 初始化歷史記錄
        };

        this.rooms.set(roomId, room);
        const undoLimitText = room.settings.undoLimit === null
            ? '無限制'
            : room.settings.undoLimit === 0
                ? '不允許'
                : `${room.settings.undoLimit}次`;
        console.log(`✅ 房間已創建: ${roomId} (房主: ${hostSocketId}, 執${hostSide}, 悔棋: ${undoLimitText})`);
        return room;
    }

    // 加入房間
    joinRoom(roomId: string, guestSocketId: string): GameRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`❌ 房間不存在: ${roomId}`);
            return null;
        }

        if (room.guestSocketId) {
            console.log(`❌ 房間已滿: ${roomId}`);
            return null;
        }

        // 如果房間在寬限期中，取消刪除計時器
        if (room.deletionTimer) {
            clearTimeout(room.deletionTimer);
            room.deletionTimer = undefined;
            room.hostDisconnectedAt = undefined;
            console.log(`⏰ 訪客加入，取消房間刪除計時器: ${roomId}`);
        }

        room.guestSocketId = guestSocketId;
        room.updatedAt = Date.now();
        console.log(`✅ 玩家加入房間: ${roomId} (訪客: ${guestSocketId})`);
        return room;
    }

    // 查詢房間
    getRoom(roomId: string): ExtendedGameRoom | null {
        return this.rooms.get(roomId) || null;
    }

    // 查詢玩家所在房間
    getRoomBySocketId(socketId: string): ExtendedGameRoom | null {
        for (const room of this.rooms.values()) {
            if (room.hostSocketId === socketId || room.guestSocketId === socketId) {
                return room;
            }
        }
        return null;
    }

    // 更新房間狀態
    updateRoom(roomId: string, updates: Partial<GameRoom>): void {
        const room = this.rooms.get(roomId);
        if (room) {
            Object.assign(room, updates, { updatedAt: Date.now() });
        }
    }

    // 房主重新連線
    reconnectHost(roomId: string, newSocketId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        // 取消刪除計時器
        if (room.deletionTimer) {
            clearTimeout(room.deletionTimer);
            room.deletionTimer = undefined;
            console.log(`⏰ 取消房間刪除計時器: ${roomId}`);
        }

        // 更新房主 Socket ID
        room.hostSocketId = newSocketId;
        room.hostDisconnectedAt = undefined;
        room.updatedAt = Date.now();
        console.log(`🔄 房主重新連線: ${roomId} (新 Socket ID: ${newSocketId})`);
        return true;
    }

    // 移除玩家（處理斷線）
    removePlayer(socketId: string): { room: ExtendedGameRoom; wasHost: boolean } | null {
        const room = this.getRoomBySocketId(socketId);
        if (!room) return null;

        const wasHost = room.hostSocketId === socketId;

        if (wasHost) {
            // 檢查是否有訪客
            const hasGuest = room.guestSocketId !== null;

            if (hasGuest) {
                // 有訪客：立即刪除房間（遊戲已開始）
                if (room.deletionTimer) {
                    clearTimeout(room.deletionTimer);
                }
                this.rooms.delete(room.id);
                console.log(`🗑️ 房間已刪除 (房主離開，有訪客): ${room.id}`);
            } else {
                // 無訪客：設置寬限期（可能只是切換 APP）
                room.hostDisconnectedAt = Date.now();
                room.deletionTimer = setTimeout(() => {
                    this.rooms.delete(room.id);
                    console.log(`🗑️ 房間已刪除 (寬限期結束): ${room.id}`);
                }, this.GRACE_PERIOD);
                console.log(`⏰ 房主斷線，設置 ${this.GRACE_PERIOD / 1000} 秒寬限期: ${room.id}`);
            }
        } else {
            // 訪客離開，清空訪客位置
            room.guestSocketId = null;
            room.updatedAt = Date.now();
            console.log(`👋 訪客離開房間: ${room.id}`);
        }

        return { room, wasHost };
    }

    // 清理閒置房間（15 分鐘無活動）
    cleanupIdleRooms(): void {
        const now = Date.now();
        const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 分鐘

        for (const [roomId, room] of this.rooms.entries()) {
            if (now - room.updatedAt > IDLE_TIMEOUT) {
                // 清除計時器（避免記憶體洩漏）
                if (room.deletionTimer) {
                    clearTimeout(room.deletionTimer);
                }
                this.rooms.delete(roomId);
                console.log(`🗑️ 清理閒置房間: ${roomId}`);
            }
        }
    }

    // 取得房間總數（用於監控）
    getRoomCount(): number {
        return this.rooms.size;
    }

    // 檢查是否可以悔棋
    canUndo(roomId: string, player: Player): { canUndo: boolean; reason?: string } {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { canUndo: false, reason: '房間不存在' };
        }

        // 檢查設定是否允許悔棋
        if (room.settings.undoLimit === 0) {
            return { canUndo: false, reason: '此房間不允許悔棋' };
        }

        // 檢查是否有歷史記錄
        if (room.history.length === 0) {
            return { canUndo: false, reason: '沒有可以悔棋的步驟' };
        }

        // 檢查最後一步是否是該玩家下的
        const lastMove = room.history[room.history.length - 1];
        if (lastMove.player !== player) {
            return { canUndo: false, reason: '只能悔自己剛下的棋' };
        }

        // 檢查悔棋次數
        if (room.settings.undoLimit !== null) {
            const used = room.undoCount[player];
            if (used >= room.settings.undoLimit) {
                return { canUndo: false, reason: `悔棋次數已用完（${used}/${room.settings.undoLimit}）` };
            }
        }

        // 檢查遊戲是否已結束
        if (room.winner) {
            return { canUndo: false, reason: '遊戲已結束，無法悔棋' };
        }

        return { canUndo: true };
    }

    // 撤銷最後一步
    undoLastMove(roomId: string, player: Player): ExtendedGameRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        // 檢查是否可以悔棋
        const { canUndo, reason } = this.canUndo(roomId, player);
        if (!canUndo) {
            console.log(`❌ 無法悔棋: ${reason}`);
            return null;
        }

        // 移除最後一步
        const lastMove = room.history.pop();
        if (!lastMove) return null;

        // 恢復棋盤
        room.board[lastMove.position.y][lastMove.position.x] = null;

        // 切換回合（輪到請求方重新下）
        room.turn = player;

        // 更新最後一步
        room.lastMove = room.history.length > 0
            ? room.history[room.history.length - 1].position
            : null;

        // 清除勝利狀態
        room.winner = null;
        room.winningLine = null;

        // 增加悔棋次數
        room.undoCount[player]++;

        // 更新時間戳
        room.updatedAt = Date.now();

        console.log(`♻️ 悔棋成功: ${roomId} (${player}, 已使用 ${room.undoCount[player]} 次)`);
        return room;
    }
}

export const roomManager = new RoomManager();
