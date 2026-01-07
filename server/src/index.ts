
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './roomManager.js';
import { checkWin, isBoardFull } from './gameLogic.js';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
    Player,
    Position
} from './types.js';

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
    console.log(`🔌 新連線: ${socket.id}`);

    // 創建房間
    socket.on('CREATE_ROOM', ({ side }, callback) => {
        try {
            const room = roomManager.createRoom(socket.id, side);

            // 產生分享 URL
            const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const shareUrl = `${baseUrl}/#room=${room.id}`;

            socket.emit('ROOM_CREATED', { roomId: room.id, shareUrl });

            if (callback) {
                callback({ success: true, roomId: room.id, shareUrl });
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
                    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
                    const shareUrl = `${baseUrl}/#room=${room.id}`;

                    socket.emit('ROOM_RECONNECTED', { roomId: room.id, shareUrl });

                    if (callback) {
                        callback({ success: true, roomId: room.id, shareUrl });
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
    socket.on('JOIN_ROOM', ({ roomId }, callback) => {
        try {
            console.log(`🔍 嘗試加入房間: ${roomId}, Socket ID: ${socket.id}`);

            const room = roomManager.joinRoom(roomId, socket.id);

            if (!room) {
                const existingRoom = roomManager.getRoom(roomId);
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

            // 通知訪客
            const guestSide: Player = room.hostSide === 'black' ? 'white' : 'black';
            socket.emit('ROOM_JOINED', { room, yourSide: guestSide });

            // 通知房主
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

        // 廣播給雙方
        const updateData = {
            board: newBoard,
            turn: nextTurn,
            winner,
            winningLine,
            lastMove: pos
        };

        io.to(room.hostSocketId).emit('GAME_UPDATE', updateData);
        if (room.guestSocketId) {
            io.to(room.guestSocketId).emit('GAME_UPDATE', updateData);
        }

        console.log(`🎯 落子: 房間 ${room.id}, 玩家 ${playerSide}, 位置 (${x}, ${y})`);
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

    // 斷線處理
    socket.on('disconnect', () => {
        console.log(`🔌 斷線: ${socket.id}`);

        const result = roomManager.removePlayer(socket.id);
        if (result) {
            const { room, wasHost } = result;

            // 通知對方玩家
            const opponentSocketId = wasHost ? room.guestSocketId : room.hostSocketId;
            if (opponentSocketId) {
                io.to(opponentSocketId).emit('OPPONENT_LEFT');
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
