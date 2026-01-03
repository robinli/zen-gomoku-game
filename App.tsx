
import React, { useState, useEffect, useRef } from 'react';
import { GameRoom, Player, Position } from './types';
import Board from './components/Board';
import Lobby from './components/Lobby';
import GameInfo from './components/GameInfo';
import { socketService } from './services/socketService';

const App: React.FC = () => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用 Ref 來處理同步鎖定
  const isProcessingMove = useRef(false);
  const hasInitialized = useRef(false);
  // 追蹤已嘗試加入的房間，防止無限重試
  const attemptedRooms = useRef<Set<string>>(new Set());

  // 提取共用的檢查和加入房間函數
  const checkAndJoinRoom = () => {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const roomId = params.get('room');

    // 防止無限重試：檢查是否已嘗試過此房間
    if (roomId
      && !room
      && !isConnecting
      && socketService.isConnected()
      && !attemptedRooms.current.has(roomId)
    ) {
      console.log('🔗 偵測到房間 ID，嘗試加入:', roomId);
      attemptedRooms.current.add(roomId);
      handleJoinRoom(roomId);
    }
  };

  // 初始化 Socket 連線
  useEffect(() => {
    if (hasInitialized.current) {
      console.log('⏭️ Socket 已初始化，跳過');
      return;
    }
    hasInitialized.current = true;

    console.log('🚀 正在初始化 Socket 連線...');
    socketService.connect();

    // 監聽連線成功事件
    socketService.onConnect(() => {
      console.log('✅ Socket 連線成功');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // 🔥 方案 1：Socket 連線成功後，立即檢查 URL hash 並自動加入房間
      checkAndJoinRoom();
    });

    // 監聽連線錯誤
    socketService.onConnectError((error) => {
      console.error('❌ Socket 連線錯誤:', error);
      setIsConnected(false);
      setIsConnecting(false);
      setError('無法連線到伺服器，請檢查網路連線');
    });

    // 監聽遊戲更新
    socketService.onGameUpdate((data) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          board: data.board,
          turn: data.turn,
          winner: data.winner,
          winningLine: data.winningLine,
          lastMove: data.lastMove,
          updatedAt: Date.now()
        };
      });
      isProcessingMove.current = false;
      setIsReconnecting(false);
    });

    // 監聽對手離開
    socketService.onOpponentLeft(() => {
      setIsConnected(false);
      setError('對手已離開房間');
    });

    // 監聽錯誤
    socketService.onError(({ message }) => {
      console.error('Server 錯誤:', message);
      if (!room) {
        setError(message);
        setIsConnecting(false);

        // 延遲清除 hash，讓用戶能看到錯誤訊息 3 秒
        setTimeout(() => {
          console.log('⏰ 清除錯誤狀態並返回大廳');
          window.location.hash = '';
          setError(null);
          // 清除嘗試記錄，允許重新嘗試
          attemptedRooms.current.clear();
        }, 3000);
      }
    });

    // 監聽房間加入事件（當第二個玩家加入時，房主也會收到這個事件）
    socketService.onRoomJoined(({ room: serverRoom, yourSide }) => {
      console.log('🎉 對手已加入房間！更新房間狀態', serverRoom);

      setRoom(prev => {
        // 轉換服務器端的房間數據為客戶端格式
        // 服務器端使用 hostSocketId/guestSocketId/hostSide
        // 客戶端使用 players: { black?: string, white?: string }
        const hasGuest = (serverRoom as any).guestSocketId !== null;
        const hostSide = (serverRoom as any).hostSide as Player;
        const guestSide: Player = hostSide === 'black' ? 'white' : 'black';

        const players: { black?: string; white?: string } = {};
        players[hostSide as 'black' | 'white'] = yourSide === hostSide ? 'me' : 'opponent';
        if (hasGuest) {
          players[guestSide as 'black' | 'white'] = yourSide === guestSide ? 'me' : 'opponent';
        }

        if (!prev) {
          // 訪客加入，直接設置房間狀態
          return {
            id: serverRoom.id,
            board: serverRoom.board,
            turn: serverRoom.turn,
            winner: serverRoom.winner,
            winningLine: serverRoom.winningLine,
            lastMove: serverRoom.lastMove,
            players,
            updatedAt: Date.now()
          };
        } else {
          // 房主收到對手加入的通知，更新 players
          return {
            ...prev,
            players,
            updatedAt: Date.now()
          };
        }
      });
      setIsConnected(true);
    });

    // ⚠️ 不要在 cleanup 中 disconnect，避免 React Strict Mode 導致的問題
    // 只有在真正離開應用時才斷線（例如 goHome 函數中）
  }, []);

  // 檢查 URL Hash 自動加入房間（處理 hashchange 事件）
  useEffect(() => {
    // 延遲檢查，確保 Socket 已連線（作為備用方案）
    const timer = setTimeout(checkAndJoinRoom, 500);

    // 監聽 URL hash 變化（當用戶手動更改 URL 時）
    window.addEventListener('hashchange', checkAndJoinRoom);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', checkAndJoinRoom);
    };
  }, [room, isConnecting]);

  // 建立房主模式 (Host)
  const handleCreate = (side: Player) => {
    // 檢查 Socket 是否已連線
    if (!socketService.isConnected()) {
      setError('網路連線中，請稍後再試');
      console.error('❌ Socket 未連線');
      return;
    }

    setIsConnecting(true);
    setError(null);

    socketService.createRoom(side, ({ roomId, shareUrl }) => {
      window.location.hash = `room=${roomId}`;

      const newRoom: GameRoom = {
        id: roomId,
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        turn: 'black',
        winner: null,
        winningLine: null,
        lastMove: null,
        players: { [side]: 'me' },
        updatedAt: Date.now(),
      };

      setRoom(newRoom);
      setLocalPlayer(side);
      setIsConnecting(false);

      console.log('✅ 房間已創建:', roomId);
      console.log('📋 分享連結:', shareUrl);
    });
  };

  // 加入房間模式 (Guest)
  const handleJoinRoom = (roomId: string) => {
    setIsConnecting(true);
    setError(null);

    socketService.joinRoom(roomId, ({ room: serverRoom, yourSide }) => {
      setRoom({
        ...serverRoom,
        players: {
          [yourSide]: 'me',
          [yourSide === 'black' ? 'white' : 'black']: 'opponent'
        }
      });
      setLocalPlayer(yourSide);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      console.log('✅ 已加入房間:', roomId, '| 您執:', yourSide);
    });
  };

  // 落子
  const handleMove = (pos: Position) => {
    if (isProcessingMove.current) return;
    if (!room || !localPlayer || room.winner || room.turn !== localPlayer) return;
    if (room.board[pos.y][pos.x]) return;
    if (!socketService.isConnected()) {
      setError('連線中斷，請重新整理頁面');
      return;
    }

    isProcessingMove.current = true;

    // 樂觀更新 UI（立即顯示自己的落子）
    const newBoard = room.board.map(row => [...row]);
    newBoard[pos.y][pos.x] = localPlayer;

    setRoom(prev => prev ? {
      ...prev,
      board: newBoard,
      lastMove: pos,
      updatedAt: Date.now()
    } : null);

    // 發送給 Server
    socketService.makeMove(pos.x, pos.y);
  };

  // 重新開始
  const handleReset = () => {
    if (!room) return;
    socketService.resetGame();
  };

  // 返回大廳
  const goHome = () => {
    socketService.disconnect();
    window.location.hash = '';
    window.location.reload();
  };

  const isBoardDisabled =
    !socketService.isConnected() ||
    (room !== null && room.turn !== localPlayer) ||
    (room !== null && room.winner !== null);

  // 決定何時顯示致命錯誤畫面
  const showFatalError = error && !room;

  return (
    <div className="min-h-screen bg-[#f8f5f2] flex flex-col">
      {/* 固定頂部資訊條 - 方案 A */}
      {room && (
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* 左側：遊戲標題 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-sm font-bold font-serif text-slate-900">禪意五子棋</h1>
                <p className="text-[10px] text-slate-400">房間 {room.id}</p>
              </div>
            </div>

            {/* 中間：當前回合指示 */}
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${room.turn === 'black' ? 'bg-slate-900 scale-110' : 'bg-slate-200'}`}>
                <div className="w-2.5 h-2.5 rounded-full border border-white/20"></div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${room.turn === 'white' ? 'bg-white scale-110 ring-1 ring-slate-300' : 'bg-slate-200'}`}>
                <div className="w-2.5 h-2.5 rounded-full border border-slate-900/10 bg-white"></div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 leading-tight">
                  {room.turn === 'black' ? '黑方' : '白方'}
                  <span className="hidden sm:inline">回合</span>
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {room.winner ? '已結束' : (localPlayer === room.turn ? '您的' : '對手')}
                </p>
              </div>
            </div>


            {/* 右側：連線狀態 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isReconnecting ? 'bg-amber-500 animate-pulse' :
                (isConnected && Object.keys(room.players).length === 2) ? 'bg-green-500' :
                  'bg-amber-500 animate-pulse'
                }`}></span>
              <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                {isReconnecting ? '重連中' :
                  (isConnected && Object.keys(room.players).length === 2) ? '已連線' :
                    '等待中'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 非遊戲狀態的標題 */}
      {!room && (
        <header className="py-6 text-center animate-in fade-in duration-1000">
          <h1 className="text-4xl font-bold font-serif text-slate-900 tracking-tighter">禪意五子棋</h1>
          <p className="text-slate-400 italic text-sm mt-1">
            {isConnected ? '即時對戰中' : (isReconnecting ? '網路恢復中...' : 'Client-Server 連線版本')}
          </p>
        </header>
      )}

      {/* 主要內容區域 */}
      <div className="flex-1 p-4 pb-20 flex flex-col items-center">

        {showFatalError && (
          <div className="mb-6 max-w-md w-full p-6 bg-white border border-red-100 shadow-xl rounded-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <h2 className="font-bold">連線失敗</h2>
            </div>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">{error}</p>
            <button onClick={goHome} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
              返回大廳
            </button>
          </div>
        )}

        {isConnecting && !room && !error && (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-serif italic">正在尋找遊戲房間中...</p>
          </div>
        )}

        {!room && !isConnecting && !error && (
          <Lobby onCreate={handleCreate} />
        )}

        {room && (
          <main className={`w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center mb-8 transition-all duration-700 ${isConnecting ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
            <div className="w-full flex justify-center relative">
              <Board
                board={room.board}
                onMove={handleMove}
                lastMove={room.lastMove}
                winner={room.winner}
                winningLine={room.winningLine}
                turn={room.turn}
                disabled={isBoardDisabled}
              />
              {/* 修正後的提示層：僅在真正的斷線重連 (isReconnecting) 且對局未結束時顯示 */}
              {isReconnecting && !room.winner && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-xl animate-in fade-in">
                  <div className="bg-white/90 px-6 py-4 rounded-2xl shadow-2xl border border-amber-100 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-amber-700 font-bold text-sm">網路不穩定，嘗試恢復連線中...</p>
                  </div>
                </div>
              )}
            </div>
            <aside className="w-full lg:w-80">
              <GameInfo
                room={room}
                localPlayer={localPlayer}
                onReset={handleReset}
                isConnected={isConnected}
                isReconnecting={isReconnecting}
              />
            </aside>
          </main>
        )}

        <footer className="mt-auto py-8 text-slate-300 text-[10px] uppercase tracking-widest text-center">
          Client-Server Architecture • Zen Aesthetics
        </footer>
      </div>
    </div>
  );
};

export default App;
