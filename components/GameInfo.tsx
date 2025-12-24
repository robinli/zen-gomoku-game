
import React, { useState } from 'react';
import { GameRoom, Player } from '../types';

interface GameInfoProps {
  room: GameRoom;
  localPlayer: Player | null;
  onReset: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ room, localPlayer, onReset }) => {
  const [copied, setCopied] = useState(false);
  const shareLink = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Turn Indicator */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">當前狀態</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${room.turn === 'black' ? 'bg-slate-900 scale-110 shadow-lg' : 'bg-slate-200'}`}>
              <div className="w-4 h-4 rounded-full border border-white/20"></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${room.turn === 'white' ? 'bg-white scale-110 shadow-lg ring-1 ring-slate-200' : 'bg-slate-200'}`}>
              <div className="w-4 h-4 rounded-full border border-slate-900/10 bg-white"></div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-serif font-bold text-lg">
              {room.turn === 'black' ? '黑方回合' : '白方回合'}
            </p>
            <p className="text-xs text-slate-400">
              {localPlayer === room.turn ? '您的回合' : '等待對手中...'}
            </p>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">分享邀請</h3>
        <p className="text-sm text-slate-500 mb-3">邀請朋友加入此房間進行對局：</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            readOnly 
            value={room.id}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
          />
          <button 
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {copied ? '已複製' : '複製連結'}
          </button>
        </div>
      </div>

      {/* Reset */}
      <button 
        onClick={onReset}
        className="w-full py-3 border border-slate-200 text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-600 transition-all"
      >
        重新開始對局
      </button>

      <div className="text-[10px] text-slate-400 text-center uppercase tracking-tighter">
        Room ID: {room.id} • Player: {localPlayer === 'black' ? 'Black (Host)' : 'White (Guest)'}
      </div>
    </div>
  );
};

export default GameInfo;
