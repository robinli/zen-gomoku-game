
import { GameRoom, Player } from './types.js';
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
    createRoom(hostSocketId: string, hostSide: Player): GameRoom {
        const roomId = this.generateRoomId();

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
        };

        this.rooms.set(roomId, room);
        console.log(`✅ 房間已創建: ${roomId} (房主: ${hostSocketId}, 執${hostSide})`);
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
}

export const roomManager = new RoomManager();
