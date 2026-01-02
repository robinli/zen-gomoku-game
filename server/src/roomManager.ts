
import { GameRoom, Player } from './types.js';
import { createEmptyBoard } from './gameLogic.js';

class RoomManager {
    private rooms: Map<string, GameRoom> = new Map();

    // 產生 6 位大寫房間 ID
    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 創建房間
    createRoom(hostSocketId: string, hostSide: Player): GameRoom {
        const roomId = this.generateRoomId();

        const room: GameRoom = {
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

        room.guestSocketId = guestSocketId;
        room.updatedAt = Date.now();
        console.log(`✅ 玩家加入房間: ${roomId} (訪客: ${guestSocketId})`);
        return room;
    }

    // 查詢房間
    getRoom(roomId: string): GameRoom | null {
        return this.rooms.get(roomId) || null;
    }

    // 查詢玩家所在房間
    getRoomBySocketId(socketId: string): GameRoom | null {
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

    // 移除玩家（處理斷線）
    removePlayer(socketId: string): { room: GameRoom; wasHost: boolean } | null {
        const room = this.getRoomBySocketId(socketId);
        if (!room) return null;

        const wasHost = room.hostSocketId === socketId;

        if (wasHost) {
            // 房主離開，刪除整個房間
            this.rooms.delete(room.id);
            console.log(`🗑️ 房間已刪除 (房主離開): ${room.id}`);
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
