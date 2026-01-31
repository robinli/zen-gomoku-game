
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './roomManager.js';
import { checkWin, isBoardFull, checkThreats } from './gameLogic.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    Player,
    Position
} from './types.js';

import { authMiddleware } from './middleware/auth.js';

const app = express();
const httpServer = createServer(app);

// CORS 設定
app.use(cors());
app.use(express.json());

// Socket.IO 設定
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: (origin, callback) => {
            // 開發環境：允許所有 localhost
            if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
                callback(null, true);
            } else if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST']
    }
});

// 🔒 認證中間件
io.use(authMiddleware);

console.log('🎯 Socket.IO 伺服器已初始化');
console.log('📌 CORS: 允許 localhost 所有端口 + ', process.env.CLIENT_URL || '(未設定)');

// 健康檢查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        rooms: roomManager.getRoomCount(),
        timestamp: new Date().toISOString()
    });
});

// 系統監控端點（詳細資訊）
app.get('/metrics', (req, res) => {
    const memUsage = process.memoryUsage();

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(process.uptime()),
            formatted: formatUptime(process.uptime())
        },
        rooms: {
            active: roomManager.getRoomCount(),
            // 理論可支援房間數（假設每房間 2.3 KB）
            maxEstimated: Math.floor((memUsage.heapTotal - memUsage.heapUsed) / 2300)
        },
        connections: {
            active: io.engine.clientsCount || 0
        },
        memory: {
            // RSS (Resident Set Size): 總記憶體使用
            rss: formatBytes(memUsage.rss),
            // Heap Total: 堆積記憶體總量
            heapTotal: formatBytes(memUsage.heapTotal),
            // Heap Used: 堆積記憶體使用量
            heapUsed: formatBytes(memUsage.heapUsed),
            // External: C++ 物件綁定的記憶體
            external: formatBytes(memUsage.external),
            // 使用率
            heapUsagePercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2) + '%'
        },
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        }
    });
});

// 輔助函數：格式化位元組
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// 輔助函數：格式化運行時間
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

// WebSocket 連線處理
io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`🔌 新連線: ${socket.id} | 用戶: ${user?.displayName || 'Unknown'}`);

    // 創建房間
    socket.on('CREATE_ROOM', ({ side, settings, userName: explicitUserName }, callback) => {
        try {
            // 優先使用參數傳來的名稱，其次是 Token 解析的名稱
            const userName = explicitUserName || (socket as any).user?.name;
            const room = roomManager.createRoom(socket.id, side, settings, userName);

            // 讓創建者加入 Socket.IO 房間
            socket.join(room.id);

            // 產生分享 URL
            const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const shareUrl = `${baseUrl}/#room=${room.id}`;

            socket.emit('ROOM_CREATED', {
                roomId: room.id,
                shareUrl,
                settings: room.settings  // 返回設定
            });

            if (callback) {
                callback({
                    success: true,
                    roomId: room.id,
                    shareUrl,
                    settings: room.settings  // 返回設定
                });
            }
        } catch (error) {
            console.error('創建房間失敗:', error);
            socket.emit('ERROR', { message: '創建房間失敗，請重試' });
            if (callback) {
                callback({ success: false, error: '創建房間失敗' });
            }
        }
    });

    // 房主重新連線到房間
    socket.on('RECONNECT_ROOM', ({ roomId }, callback) => {
        try {
            console.log(`🔄 嘗試重新連線到房間: ${roomId}, Socket ID: ${socket.id}`);

            const success = roomManager.reconnectHost(roomId, socket.id);

            if (success) {
                const room = roomManager.getRoom(roomId);
                if (room) {
                    // 重新加入 Socket.IO 房間
                    socket.join(room.id);

                    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
                    const shareUrl = `${baseUrl}/#room=${room.id}`;

                    socket.emit('ROOM_RECONNECTED', { roomId: room.id, shareUrl, room });

                    if (callback) {
                        callback({ success: true, roomId: room.id, shareUrl, room });
                    }
                    console.log(`✅ 房主重新連線成功: ${roomId}`);
                } else {
                    throw new Error('房間不存在');
                }
            } else {
                console.log(`❌ 重新連線失敗: 房間不存在或已過期 (${roomId})`);
                socket.emit('ERROR', { message: '房間不存在或已過期' });
                if (callback) {
                    callback({ success: false, error: '房間不存在或已過期' });
                }
            }
        } catch (error) {
            console.error('重新連線失敗:', error);
            socket.emit('ERROR', { message: '重新連線失敗' });
            if (callback) {
                callback({ success: false, error: '重新連線失敗' });
            }
        }
    });

    // 加入房間
    socket.on('JOIN_ROOM', ({ roomId, userName: explicitUserName }, callback) => {
        try {
            console.log(`🔍 嘗試加入房間: ${roomId}, Socket ID: ${socket.id}`);

            const existingRoom = roomManager.getRoom(roomId);

            // 檢查是否是訪客重新連線
            if (existingRoom && existingRoom.guestDisconnectedAt) {
                console.log(`🔄 檢測到訪客重新連線: ${roomId}`);
                const success = roomManager.reconnectGuest(roomId, socket.id);

                if (success) {
                    socket.join(roomId);
                    const guestSide: Player = existingRoom.hostSide === 'black' ? 'white' : 'black';
                    socket.emit('ROOM_JOINED', { room: existingRoom, yourSide: guestSide });

                    if (callback) {
                        callback({ success: true, room: existingRoom, yourSide: guestSide });
                    }

                    console.log(`✅ 訪客重新連線成功: ${roomId}`);
                    return;
                }
            }

            // 正常加入房間流程
            const userName = explicitUserName || (socket as any).user?.name;
            const room = roomManager.joinRoom(roomId, socket.id, userName);

            if (!room) {
                const errorMsg = existingRoom
                    ? '房間已滿，無法加入'
                    : `房間不存在 (${roomId})，可能房主已離開`;

                console.log(`❌ 加入失敗: ${errorMsg}`);
                socket.emit('ERROR', { message: errorMsg });
                if (callback) {
                    callback({ success: false, error: errorMsg });
                }
                return;
            }

            // 加入 Socket.IO 房間
            socket.join(roomId);

            // 通知訪客
            const guestSide: Player = room.hostSide === 'black' ? 'white' : 'black';
            console.log(`📡 發送 ROOM_JOINED 給訪客 (${socket.id}): guestSide=${guestSide}`);
            socket.emit('ROOM_JOINED', { room, yourSide: guestSide });

            // 通知房主 (使用定點發送更可靠)
            console.log(`📡 發送 ROOM_JOINED 給房主 (${room.hostSocketId}): hostSide=${room.hostSide}`);
            io.to(room.hostSocketId).emit('ROOM_JOINED', { room, yourSide: room.hostSide });

            if (callback) {
                callback({ success: true, room, yourSide: guestSide });
            }

            console.log(`✅ 房間已滿員: ${roomId}，遊戲開始！`);
        } catch (error) {
            console.error('加入房間失敗:', error);
            socket.emit('ERROR', { message: '加入房間失敗' });
            if (callback) {
                callback({ success: false, error: '加入房間失敗' });
            }
        }
    });

    // 落子
    socket.on('MAKE_MOVE', ({ x, y }) => {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) {
            socket.emit('ERROR', { message: '您不在任何房間中' });
            return;
        }

        // 驗證玩家回合
        const playerSide: Player = room.hostSocketId === socket.id ? room.hostSide : (room.hostSide === 'black' ? 'white' : 'black');

        if (room.turn !== playerSide) {
            socket.emit('ERROR', { message: '現在不是您的回合' });
            return;
        }

        // 驗證位置
        if (room.board[y][x] !== null) {
            socket.emit('ERROR', { message: '此位置已有棋子' });
            return;
        }

        // 驗證遊戲是否已結束
        if (room.winner) {
            socket.emit('ERROR', { message: '遊戲已結束' });
            return;
        }

        // 更新棋盤
        const newBoard = room.board.map(row => [...row]);
        newBoard[y][x] = playerSide;

        const pos: Position = { x, y };
        const winResult = checkWin(newBoard, pos);
        const winner: Player | 'draw' | null = winResult ? winResult.winner : (isBoardFull(newBoard) ? 'draw' : null);
        const winningLine: Position[] | null = winResult ? winResult.line : null;
        const nextTurn: Player = playerSide === 'black' ? 'white' : 'black';

        // 更新房間狀態
        roomManager.updateRoom(room.id, {
            board: newBoard,
            turn: nextTurn,
            winner,
            winningLine,
            lastMove: pos
        });

        // ✅ 記錄到歷史（用於悔棋）
        const updatedRoom = roomManager.getRoom(room.id);
        if (updatedRoom) {
            updatedRoom.history.push({
                step: updatedRoom.history.length + 1,
                player: playerSide,
                position: pos,
                timestamp: Date.now(),
            });
        }

        // 🎯 檢測威脅（活三、活四）- 只在遊戲未結束時檢測
        let threatLine: Position[] | null = null;
        if (!winner) {
            const threats = checkThreats(newBoard, pos);
            threatLine = threats.length > 0 ? threats : null;
        }

        // 基礎更新資料（不含威脅）
        const baseUpdateData = {
            board: newBoard,
            turn: nextTurn,
            winner,
            winningLine,
            lastMove: pos
        };

        // 對手的更新資料（包含威脅提示）
        const opponentUpdateData = {
            ...baseUpdateData,
            threatLine  // 只有對手看到威脅
        };

        // 確定對手的 Socket ID
        const opponentSocketId = room.hostSocketId === socket.id
            ? room.guestSocketId
            : room.hostSocketId;

        // 發送給下棋方（不含威脅）
        io.to(socket.id).emit('GAME_UPDATE', baseUpdateData);

        // 發送給對手方（包含威脅）
        if (opponentSocketId) {
            io.to(opponentSocketId).emit('GAME_UPDATE', opponentUpdateData);
        }

        console.log(`🎯 落子: 房間 ${room.id}, 玩家 ${playerSide}, 位置 (${x}, ${y})${threatLine ? `, 威脅: ${threatLine.length} 個棋子` : ''}`);
    });

    // 重新開始
    socket.on('RESET_GAME', () => {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) {
            socket.emit('ERROR', { message: '您不在任何房間中' });
            return;
        }

        // 重置棋盤
        const emptyBoard = Array(15).fill(null).map(() => Array(15).fill(null));

        roomManager.updateRoom(room.id, {
            board: emptyBoard,
            turn: 'black',
            winner: null,
            winningLine: null,
            lastMove: null
        });

        const updateData = {
            board: emptyBoard,
            turn: 'black' as Player,
            winner: null,
            winningLine: null,
            lastMove: null
        };

        io.to(room.hostSocketId).emit('GAME_UPDATE', updateData);
        if (room.guestSocketId) {
            io.to(room.guestSocketId).emit('GAME_UPDATE', updateData);
        }

        console.log(`🔄 重新開始: 房間 ${room.id}`);
    });

    // 請求悔棋
    socket.on('REQUEST_UNDO', () => {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) {
            socket.emit('ERROR', { message: '您不在任何房間中' });
            return;
        }

        // 確定玩家身份
        const playerSide: Player = room.hostSocketId === socket.id
            ? room.hostSide
            : (room.hostSide === 'black' ? 'white' : 'black');

        // 檢查是否可以悔棋
        const { canUndo, reason } = roomManager.canUndo(room.id, playerSide);
        if (!canUndo) {
            socket.emit('ERROR', { message: reason || '無法悔棋' });
            return;
        }

        // 通知對方玩家
        const opponentSocketId = room.hostSocketId === socket.id
            ? room.guestSocketId
            : room.hostSocketId;

        if (!opponentSocketId) {
            socket.emit('ERROR', { message: '對方玩家不在線' });
            return;
        }

        console.log(`🤔 ${playerSide} 請求悔棋: ${room.id}`);
        io.to(opponentSocketId).emit('UNDO_REQUESTED', { requestedBy: playerSide });
    });

    // 請求重新開始
    socket.on('REQUEST_RESET', () => {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) {
            socket.emit('ERROR', { message: '您不在任何房間中' });
            return;
        }

        // 確定玩家身份
        const playerSide: Player = room.hostSocketId === socket.id
            ? room.hostSide
            : (room.hostSide === 'black' ? 'white' : 'black');

        // 通知對方玩家
        const opponentSocketId = room.hostSocketId === socket.id
            ? room.guestSocketId
            : room.hostSocketId;

        if (!opponentSocketId) {
            socket.emit('ERROR', { message: '對方玩家不在線' });
            return;
        }

        console.log(`🔄 ${playerSide} 請求重新開始: ${room.id}`);
        io.to(opponentSocketId).emit('RESET_REQUESTED', { requestedBy: playerSide });
    });

    // 回應重置請求
    socket.on('RESPOND_RESET', ({ accept }) => {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) {
            socket.emit('ERROR', { message: '您不在任何房間中' });
            return;
        }

        // 確定對方玩家（請求方）
        const opponentSocketId = room.hostSocketId === socket.id
            ? room.guestSocketId
            : room.hostSocketId;

        if (!opponentSocketId) {
            return;
        }

        if (accept) {
            // 重置棋盤
            const emptyBoard = Array(15).fill(null).map(() => Array(15).fill(null));

            roomManager.updateRoom(room.id, {
                board: emptyBoard,
                turn: 'black',
                winner: null,
                winningLine: null,
                lastMove: null
            });

            // 清空歷史記錄和悔棋次數
            const updatedRoom = roomManager.getRoom(room.id);
            if (updatedRoom) {
                updatedRoom.history = [];
                updatedRoom.undoCount = { black: 0, white: 0 };
            }

            const updateData = {
                board: emptyBoard,
                turn: 'black' as Player,
                winner: null,
                winningLine: null,
                lastMove: null
            };

            // 通知雙方重置成功
            io.to(room.hostSocketId).emit('RESET_ACCEPTED');
            if (room.guestSocketId) {
                io.to(room.guestSocketId).emit('RESET_ACCEPTED');
            }

            // 同時發送遊戲更新
            io.to(room.hostSocketId).emit('GAME_UPDATE', updateData);
            if (room.guestSocketId) {
                io.to(room.guestSocketId).emit('GAME_UPDATE', updateData);
            }

            console.log(`✅ 重新開始成功: ${room.id}`);
        } else {
            // 拒絕重置
            io.to(opponentSocketId).emit('RESET_REJECTED');
            console.log(`❌ 重新開始被拒絕: ${room.id}`);
        }
    });

    // 回應悔棋請求
    socket.on('RESPOND_UNDO', ({ accept }) => {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) {
            socket.emit('ERROR', { message: '您不在任何房間中' });
            return;
        }

        // 確定對方玩家（請求方）
        const opponentSocketId = room.hostSocketId === socket.id
            ? room.guestSocketId
            : room.hostSocketId;

        if (!opponentSocketId) {
            return;
        }

        if (accept) {
            // 確定請求方的身份
            const requesterSide: Player = room.hostSocketId === opponentSocketId
                ? room.hostSide
                : (room.hostSide === 'black' ? 'white' : 'black');

            // 執行悔棋
            const updatedRoom = roomManager.undoLastMove(room.id, requesterSide);
            if (updatedRoom) {
                // 通知雙方悔棋成功
                const undoData = {
                    board: updatedRoom.board,
                    turn: updatedRoom.turn,
                    lastMove: updatedRoom.lastMove,
                    undoCount: updatedRoom.undoCount,
                };

                io.to(room.hostSocketId).emit('UNDO_ACCEPTED', undoData);
                if (room.guestSocketId) {
                    io.to(room.guestSocketId).emit('UNDO_ACCEPTED', undoData);
                }

                console.log(`✅ 悔棋成功: ${room.id} (${requesterSide})`);
            } else {
                io.to(opponentSocketId).emit('ERROR', { message: '悔棋失敗' });
            }
        } else {
            // 拒絕悔棋
            io.to(opponentSocketId).emit('UNDO_REJECTED');
            console.log(`❌ 悔棋被拒絕: ${room.id}`);
        }
    });

    // 主動離開房間
    socket.on('LEAVE_ROOM', () => {
        console.log(`👋 玩家主動離開: ${socket.id}`);

        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) return;

        const wasHost = room.hostSocketId === socket.id;
        const opponentSocketId = wasHost ? room.guestSocketId : room.hostSocketId;

        // 立即通知對方玩家
        if (opponentSocketId) {
            io.to(opponentSocketId).emit('OPPONENT_LEFT');
            console.log(`📤 立即通知對方玩家離開: ${opponentSocketId}`);
        }

        // 立即移除玩家（不使用寬限期）
        if (wasHost) {
            // 房主離開，刪除房間
            roomManager.getRoom(room.id); // 確保房間存在
            if (room.gracePeriodTimers?.host) {
                clearTimeout(room.gracePeriodTimers.host);
            }
            if (room.deletionTimer) {
                clearTimeout(room.deletionTimer);
            }
            roomManager.getRoomCount(); // 觸發內部清理
            console.log(`🗑️ 房主主動離開，刪除房間: ${room.id}`);
        } else {
            // 訪客離開，清空訪客位置
            if (room.gracePeriodTimers?.guest) {
                clearTimeout(room.gracePeriodTimers.guest);
            }
            const roomData = roomManager.getRoom(room.id);
            if (roomData) {
                roomData.guestSocketId = null;
                roomData.guestDisconnectedAt = undefined;
                roomData.updatedAt = Date.now();
            }
            console.log(`👋 訪客主動離開: ${room.id}`);
        }
    });

    // 斷線處理
    socket.on('disconnect', () => {
        console.log(`🔌 斷線: ${socket.id}`);

        const result = roomManager.removePlayer(socket.id, (opponentSocketId) => {
            // 寬限期結束，通知對方玩家
            io.to(opponentSocketId).emit('OPPONENT_LEFT');
            console.log(`📤 寬限期結束，通知對方玩家離開: ${opponentSocketId}`);
        });

        if (result) {
            const { room, wasHost, shouldNotify } = result;

            // 只有在 shouldNotify 為 true 時才立即通知對方
            if (shouldNotify) {
                const opponentSocketId = wasHost ? room.guestSocketId : room.hostSocketId;
                if (opponentSocketId) {
                    io.to(opponentSocketId).emit('OPPONENT_LEFT');
                    console.log(`📤 通知對方玩家離開: ${opponentSocketId}`);
                }
            } else {
                console.log(`⏳ 進入寬限期，暫不通知對方`);
            }
        }
    });
});

// 定期清理閒置房間（每 5 分鐘）
setInterval(() => {
    roomManager.cleanupIdleRooms();
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server 運行於 http://localhost:${PORT}`);
    console.log(`📡 WebSocket 已就緒`);
});
