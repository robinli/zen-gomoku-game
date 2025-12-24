
import React, { useState, useEffect, useCallback } from 'react';
import { GameRoom, Player, Position } from './types';
import { createEmptyBoard, checkWin, isBoardFull } from './utils/gameLogic';
import Board from './components/Board';
import Lobby from './components/Lobby';
import GameInfo from './components/GameInfo';

const STORAGE_KEY = 'ZEN_GOMOKU_STORAGE_';

const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 解析 URL Hash 取得房間 ID
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      const id = params.get('room');
      
      if (id) {
        setRoomId(id);
      } else {
        setRoomId(null);
        setRoom(null);
        setLocalPlayer(null);
        setError(null);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // 同步遊戲狀態 (核心邏輯)
  const syncRoom = useCallback((id: string) => {
    const data = localStorage.getItem(STORAGE_KEY + id);
    if (!data) {
      setError("找不到房間資料。請注意：此版本使用瀏覽器 LocalStorage，僅支援在同一台電腦的不同分頁間對戰。");
      return;
    }
    
    setError(null);
    const parsedRoom = JSON.parse(data) as GameRoom;
    setRoom(parsedRoom);

    // 自動分配角色：如果玩家還沒分配到黑/白方
    if (!localPlayer) {
      const newPlayers = { ...parsedRoom.players };
      let assignedSide: Player | null = null;

      if (!newPlayers.black) {
        newPlayers.black = 'user_' + Math.random().toString(36).slice(2, 6);
        assignedSide = 'black';
      } else if (!newPlayers.white) {
        newPlayers.white = 'user_' + Math.random().toString(36).slice(2, 6);
        assignedSide = 'white';
      }

      if (assignedSide) {
        setLocalPlayer(assignedSide);
        const updatedRoom = { ...parsedRoom, players: newPlayers };
        localStorage.setItem(STORAGE_KEY + id, JSON.stringify(updatedRoom));
        setRoom(updatedRoom);
      }
    }
  }, [localPlayer]);

  // 監聽本地儲存變化 (模擬連線)
  useEffect(() => {
    if (roomId) {
      syncRoom(roomId);
      const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY + roomId) {
          syncRoom(roomId);
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
  }, [roomId, syncRoom]);

  const handleCreate = (side: Player) => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: GameRoom = {
      id,
      board: createEmptyBoard(),
      turn: 'black',
      winner: null,
      lastMove: null,
      players: { [side]: 'host' },
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY + id, JSON.stringify(newRoom));
    setLocalPlayer(side);
    window.location.hash = `room=${id}`;
  };

  const handleMove = (pos: Position) => {
    if (!room || !localPlayer || room.winner || room.turn !== localPlayer) return;
    if (room.board[pos.y][pos.x]) return;

    const newBoard = room.board.map(row => [...row]);
    newBoard[pos.y][pos.x] = localPlayer;
    const winner = checkWin(newBoard, pos) || (isBoardFull(newBoard) ? 'draw' : null);

    const updatedRoom: GameRoom = {
      ...room,
      board: newBoard,
      turn: localPlayer === 'black' ? 'white' : 'black',
      winner,
      lastMove: pos,
      updatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY + room.id, JSON.stringify(updatedRoom));
    setRoom(updatedRoom);
  };

  const handleReset = () => {
    if (!room) return;
    const resetRoom: GameRoom = {
      ...room,
      board: createEmptyBoard(),
      turn: 'black',
      winner: null,
      lastMove: null,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY + room.id, JSON.stringify(resetRoom));
    setRoom(resetRoom);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f2] p-4 flex flex-col items-center">
      <header className="py-8 text-center animate-in fade-in duration-1000">
        <h1 className="text-4xl font-bold font-serif text-slate-900 tracking-tighter">禪意五子棋</h1>
        <p className="text-slate-400 italic text-sm mt-1">極簡・本地模擬連線</p>
      </header>

      {error && (
        <div className="mb-6 max-w-md p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center">
          {error}
          <button 
            onClick={() => window.location.hash = ''} 
            className="block w-full mt-2 font-bold underline"
          >
            返回大廳
          </button>
        </div>
      )}

      {!roomId ? (
        <Lobby onCreate={handleCreate} />
      ) : room && (
        <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
          <div className="w-full flex justify-center">
            <Board 
              board={room.board} 
              onMove={handleMove} 
              lastMove={room.lastMove} 
              winner={room.winner}
              turn={room.turn}
            />
          </div>
          <aside className="w-full lg:w-80">
            <GameInfo 
              room={room} 
              localPlayer={localPlayer} 
              onReset={handleReset} 
            />
          </aside>
        </main>
      )}

      <footer className="mt-auto py-8 text-slate-300 text-[10px] uppercase tracking-widest text-center">
        Designed for Pure Gameplay • 測試建議：請在同一瀏覽器開啟兩個分頁進行
      </footer>
    </div>
  );
};

export default App;
