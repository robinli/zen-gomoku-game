
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
  const [error, setError] = useState<string | null>(null);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  // 初始化遊戲狀態
  const initGame = (id: string, side: Player) => {
    const newRoom: GameRoom = {
      id,
      board: createEmptyBoard(),
      turn: 'black',
      winner: null,
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
          lastMove: data.lastMove,
          updatedAt: Date.now()
        };
      });
    } else if (data.type === 'RESET') {
      setRoom(prev => prev ? {
        ...prev,
        board: createEmptyBoard(),
        turn: 'black',
        winner: null,
        lastMove: null,
        updatedAt: Date.now()
      } : null);
    } else if (data.type === 'SYNC_STATE') {
      setRoom(data.state);
      setIsConnected(true);
      setIsConnecting(false);
    }
  }, []);

  // 建立房主模式
  const handleCreate = (side: Player) => {
    setIsConnecting(true);
    setError(null);
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 清除舊的 Peer
    if (peerRef.current) peerRef.current.destroy();
    
    peerRef.current = new Peer(id);
    
    peerRef.current.on('open', (id: string) => {
      window.location.hash = `room=${id}`;
      initGame(id, side);
      setIsConnecting(false);
    });

    peerRef.current.on('connection', (conn: any) => {
      connRef.current = conn;
      setIsConnected(true);
      
      conn.on('open', () => {
        const guestSide = side === 'black' ? 'white' : 'black';
        conn.send({ 
          type: 'SYNC_STATE', 
          state: {
            id,
            board: createEmptyBoard(),
            turn: 'black',
            winner: null,
            lastMove: null,
            players: { [side]: 'host', [guestSide]: 'guest' },
            updatedAt: Date.now()
          }
        });
      });

      conn.on('data', handleData);
      conn.on('close', () => setIsConnected(false));
    });

    peerRef.current.on('error', (err: any) => {
      setIsConnecting(false);
      if (err.type === 'unavailable-id') {
        setError("此房間 ID 已被佔用，請嘗試重新創建。");
      } else {
        setError("建立連線伺服器時發生錯誤。");
      }
      console.error('Peer error:', err);
    });
  };

  // 加入房間模式 (Guest)
  const joinRoom = useCallback((id: string) => {
    setIsConnecting(true);
    setError(null);
    
    if (peerRef.current) peerRef.current.destroy();
    
    peerRef.current = new Peer(); 
    
    peerRef.current.on('open', () => {
      const conn = peerRef.current.connect(id, {
        reliable: true
      });
      connRef.current = conn;

      conn.on('open', () => {
        setIsConnected(true);
        // 房主會透過 SYNC_STATE 同步狀態回來
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

      conn.on('error', (err: any) => {
        setIsConnecting(false);
        setError("無法連線到該房間。");
        console.error('Connection error:', err);
      });

      conn.on('close', () => {
        setIsConnected(false);
        setError("對方已中斷連線。");
      });
    });

    peerRef.current.on('error', (err: any) => {
      setIsConnecting(false);
      setError("連線伺服器失敗，房主可能已離線。");
      console.error('Peer joining error:', err);
    });
  }, [handleData]);

  // 監聽 URL Hash 變化
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      const id = params.get('room');
      
      // 只有在還沒有 room 且沒有正在連線時才自動加入
      if (id && !room && !isConnecting && !peerRef.current) {
        joinRoom(id);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [joinRoom, room, isConnecting]);

  const handleMove = (pos: Position) => {
    if (!room || !localPlayer || room.winner || room.turn !== localPlayer || !isConnected) return;
    if (room.board[pos.y][pos.x]) return;

    const newBoard = room.board.map(row => [...row]);
    newBoard[pos.y][pos.x] = localPlayer;
    const winnerResult: Player | 'draw' | null = checkWin(newBoard, pos) || (isBoardFull(newBoard) ? 'draw' : null);
    const nextTurn: Player = localPlayer === 'black' ? 'white' : 'black';

    const moveData = {
      type: 'MOVE',
      board: newBoard,
      nextTurn,
      winner: winnerResult,
      lastMove: pos
    };

    setRoom(prev => prev ? { ...prev, ...moveData, updatedAt: Date.now() } : null);
    
    if (connRef.current) {
      connRef.current.send(moveData);
    }
  };

  const handleReset = () => {
    if (!room || !isConnected) return;
    const resetData = { type: 'RESET' };
    
    setRoom(prev => prev ? {
      ...prev,
      board: createEmptyBoard(),
      turn: 'black',
      winner: null,
      lastMove: null,
      updatedAt: Date.now()
    } : null);

    if (connRef.current) {
      connRef.current.send(resetData);
    }
  };

  const goHome = () => {
    window.location.hash = '';
    window.location.reload(); // 徹底清除狀態
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] p-4 flex flex-col items-center">
      <header className="py-8 text-center animate-in fade-in duration-1000">
        <h1 className="text-4xl font-bold font-serif text-slate-900 tracking-tighter">禪意五子棋</h1>
        <p className="text-slate-400 italic text-sm mt-1">
          {isConnected ? '即時對戰中' : '跨電腦 P2P 連線版本'}
        </p>
      </header>

      {error && (
        <div className="mb-6 max-w-md w-full p-6 bg-white border border-red-100 shadow-xl rounded-2xl animate-in zoom-in duration-300">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <h2 className="font-bold">連線失敗</h2>
          </div>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">{error}</p>
          <button 
            onClick={goHome} 
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
          >
            返回大廳重新開始
          </button>
        </div>
      )}

      {isConnecting && !error && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-serif italic">正在尋找茶室中...</p>
        </div>
      )}

      {!room && !isConnecting && !error && (
        <Lobby onCreate={handleCreate} />
      )}

      {room && !error && (
        <main className={`w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center transition-all duration-700 ${isConnecting ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
          <div className="w-full flex justify-center">
            <Board 
              board={room.board} 
              onMove={handleMove} 
              lastMove={room.lastMove} 
              winner={room.winner}
              turn={room.turn}
              disabled={!isConnected}
            />
          </div>
          <aside className="w-full lg:w-80">
            <GameInfo 
              room={room} 
              localPlayer={localPlayer} 
              onReset={handleReset} 
              isConnected={isConnected}
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
