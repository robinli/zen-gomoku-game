
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameRoom, Player, Position } from './types';
import { createEmptyBoard, checkWin, isBoardFull } from './utils/gameLogic';
import Board from './components/Board';
import Lobby from './components/Lobby';
import GameInfo from './components/GameInfo';

// 擴充類型以處理 P2P
declare const Peer: any;

const App: React.FC = () => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 使用 Ref 來處理同步鎖定與連線參考
  const isProcessingMove = useRef(false);
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  // 初始化遊戲狀態
  const initGame = (id: string, side: Player) => {
    const newRoom: GameRoom = {
      id,
      board: createEmptyBoard(),
      turn: 'black',
      winner: null,
      winningLine: null,
      lastMove: null,
      players: { [side]: 'me' },
      updatedAt: Date.now(),
    };
    setRoom(newRoom);
    setLocalPlayer(side);
  };

  // 處理接收到的資料
  const handleData = useCallback((data: any) => {
    if (data.type === 'MOVE') {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          board: data.board,
          turn: data.nextTurn,
          winner: data.winner,
          winningLine: data.winningLine,
          lastMove: data.lastMove,
          updatedAt: Date.now()
        };
      });
      isProcessingMove.current = false;
    } else if (data.type === 'RESET') {
      setRoom(prev => prev ? {
        ...prev,
        board: createEmptyBoard(),
        turn: 'black',
        winner: null,
        winningLine: null,
        lastMove: null,
        updatedAt: Date.now()
      } : null);
      isProcessingMove.current = false;
    } else if (data.type === 'SYNC_STATE') {
      setRoom(data.state);
      setIsConnected(true);
      setIsConnecting(false);
      setIsReconnecting(false);
      setError(null); // 同步成功，清除所有錯誤狀態
      if (reconnectTimerRef.current) {
        window.clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }
  }, []);

  // 建立房主模式 (Host)
  const handleCreate = (side: Player) => {
    setIsConnecting(true);
    setError(null);
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    if (peerRef.current) peerRef.current.destroy();
    peerRef.current = new Peer(id);
    
    peerRef.current.on('open', (id: string) => {
      window.location.hash = `room=${id}`;
      initGame(id, side);
      setIsConnecting(false);
    });

    // 處理信令伺服器中斷 (Peer server disconnection)
    peerRef.current.on('disconnected', () => {
      console.log("信令伺服器斷開，嘗試重連...");
      peerRef.current.reconnect();
    });

    peerRef.current.on('connection', (conn: any) => {
      connRef.current = conn;
      setIsConnected(true);
      setIsReconnecting(false);
      setError(null);
      
      conn.on('open', () => {
        setRoom(currentRoom => {
          if (currentRoom) {
            const guestSide = side === 'black' ? 'white' : 'black';
            const stateToSync = {
              ...currentRoom,
              players: { [side]: 'host', [guestSide]: 'guest' }
            };
            conn.send({ type: 'SYNC_STATE', state: stateToSync });
          }
          return currentRoom;
        });
      });

      conn.on('data', handleData);
      conn.on('close', () => {
        setIsConnected(false);
        setIsReconnecting(true);
      });
    });

    peerRef.current.on('error', (err: any) => {
      console.error("Peer Error:", err);
      // 如果遊戲已經在進行中，不要顯示致命錯誤視窗，僅在後台嘗試恢復
      if (!room) {
        setIsConnecting(false);
        setError("建立房間失敗，請重新嘗試。");
      }
    });
  };

  // 加入房間模式 (Guest)
  const joinRoom = useCallback((id: string) => {
    setIsConnecting(true);
    setError(null);
    if (peerRef.current) peerRef.current.destroy();
    peerRef.current = new Peer(); 
    
    const connectToHost = () => {
      // 如果連線已存在且開啟中，不重複連線
      if (connRef.current && connRef.current.open) return;

      const conn = peerRef.current.connect(id, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        setIsConnected(true);
        setIsReconnecting(false);
        setIsConnecting(false);
        setError(null);
        if (reconnectTimerRef.current) {
          window.clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      });

      conn.on('data', (data: any) => {
        if (data.type === 'SYNC_STATE') {
          setRoom(data.state);
          const hostSide = data.state.players.black === 'host' ? 'black' : 'white';
          setLocalPlayer(hostSide === 'black' ? 'white' : 'black');
          setIsConnecting(false);
        } else {
          handleData(data);
        }
      });

      conn.on('close', () => {
        setIsConnected(false);
        setIsReconnecting(true);
        // 啟動重連計時器
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = window.setInterval(() => {
            console.log("嘗試重新連接到房主...");
            connectToHost();
          }, 3000);
        }
      });
    };

    peerRef.current.on('open', connectToHost);

    peerRef.current.on('disconnected', () => {
      peerRef.current.reconnect();
    });

    peerRef.current.on('error', (err: any) => {
      console.error("Guest Peer Error:", err);
      // 只有在初始加入失敗時才顯示致命錯誤
      if (!isConnected && !room) {
        setIsConnecting(false);
        setError("無法連線到該房間，請確認網址正確或房主已開房。");
      }
    });
  }, [handleData, isConnected, room]);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      const id = params.get('room');
      if (id && !room && !isConnecting && !peerRef.current) {
        joinRoom(id);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [joinRoom, room, isConnecting]);

  const handleMove = (pos: Position) => {
    if (isProcessingMove.current) return;
    if (!room || !localPlayer || room.winner || room.turn !== localPlayer || !isConnected) return;
    if (room.board[pos.y][pos.x]) return;

    isProcessingMove.current = true;

    const newBoard = room.board.map(row => [...row]);
    newBoard[pos.y][pos.x] = localPlayer;
    
    const winResult = checkWin(newBoard, pos);
    const winnerResult: Player | 'draw' | null = winResult ? winResult.winner : (isBoardFull(newBoard) ? 'draw' : null);
    const winningLine = winResult ? winResult.line : null;
    const nextTurn: Player = localPlayer === 'black' ? 'white' : 'black';

    const movePayload = {
      type: 'MOVE',
      board: newBoard,
      nextTurn,
      winner: winnerResult,
      winningLine,
      lastMove: pos
    };

    setRoom(prev => prev ? { 
      ...prev, 
      board: newBoard,
      turn: nextTurn,
      winner: winnerResult,
      winningLine,
      lastMove: pos,
      updatedAt: Date.now() 
    } : null);
    
    if (connRef.current) {
      connRef.current.send(movePayload);
    }
  };

  const handleReset = () => {
    if (!room || !isConnected) return;
    isProcessingMove.current = false;
    const resetData = { type: 'RESET' };
    setRoom(prev => prev ? {
      ...prev,
      board: createEmptyBoard(),
      turn: 'black',
      winner: null,
      winningLine: null,
      lastMove: null,
      updatedAt: Date.now()
    } : null);
    if (connRef.current) connRef.current.send(resetData);
  };

  const goHome = () => {
    if (reconnectTimerRef.current) window.clearInterval(reconnectTimerRef.current);
    if (peerRef.current) peerRef.current.destroy();
    window.location.hash = '';
    window.location.reload();
  };

  const isBoardDisabled = !isConnected || (room !== null && room.turn !== localPlayer) || (room !== null && room.winner !== null);

  // 決定何時顯示致命錯誤畫面
  // 如果已經在遊戲中 (room !== null)，即使有 error 也不應該跳出，而是讓重連邏輯處理
  const showFatalError = error && !room;

  return (
    <div className="min-h-screen bg-[#f8f5f2] p-4 flex flex-col items-center">
      <header className="py-8 text-center animate-in fade-in duration-1000">
        <h1 className="text-4xl font-bold font-serif text-slate-900 tracking-tighter">禪意五子棋</h1>
        <p className="text-slate-400 italic text-sm mt-1">
          {isConnected ? '即時對戰中' : (isReconnecting ? '網路恢復中...' : '跨電腦 P2P 連線版本')}
        </p>
      </header>

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
          <p className="text-slate-400 font-serif italic">正在尋找茶室中...</p>
        </div>
      )}

      {!room && !isConnecting && !error && (
        <Lobby onCreate={handleCreate} />
      )}

      {room && (
        <main className={`w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center transition-all duration-700 ${isConnecting ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
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
            {/* 斷線重連提示浮層 - 僅在對局未結束時顯示 */}
            {(isReconnecting || !isConnected) && !room.winner && (
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
        P2P Secure Connection • Zen Aesthetics
      </footer>
    </div>
  );
};

export default App;
