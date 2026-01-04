
import React, { useState } from 'react';
import { GameRoom, Player } from '../types';

interface GameInfoProps {
  room: GameRoom;
  localPlayer: Player | null;
  onReset: () => void;
  onGoHome: () => void;
  isConnected: boolean;
  isReconnecting?: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({ room, localPlayer, onReset, onGoHome, isConnected, isReconnecting }) => {
  const [copied, setCopied] = useState(false);
  const shareLink = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = () => {
    if (isReconnecting) return 'bg-amber-500 animate-pulse';
    if (isConnected && Object.keys(room.players).length === 2) return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]';
    return 'bg-amber-500 animate-pulse-soft';
  };

  const getStatusText = () => {
    if (isReconnecting) return '嘗試重新連接...';
    if (isConnected && Object.keys(room.players).length === 2) return '已建立連線';
    return '等待朋友加入...';
  };

  return (
    <div className="space-y-4">
      {/* Share Section - 只在等待對手加入時顯示 */}
      {Object.keys(room.players).length < 2 && !isReconnecting && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white animate-in zoom-in duration-500">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">邀請好友</h3>
          <p className="text-sm text-white/80 mb-4 font-light leading-relaxed">請將此連結傳送給另一台電腦的朋友，他們點擊後即可開始對弈。</p>
          <div className="flex flex-col gap-2">
            <div className="bg-white/10 rounded-lg px-3 py-2 text-xs font-mono break-all border border-white/10">
              {shareLink}
            </div>
            <button
              onClick={handleCopy}
              className={`mt-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
            >
              {copied ? '✓ 已複製連結' : '複製分享連結'}
            </button>
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        disabled={!isConnected}
        className={`w-full py-3 border border-slate-200 text-slate-400 rounded-xl text-sm font-medium transition-all ${isConnected ? 'hover:bg-slate-50 hover:text-slate-600' : 'opacity-30 cursor-not-allowed'}`}
      >
        重新開始對局
      </button>

      {/* 返回大厅 */}
      <button
        onClick={onGoHome}
        className="w-full py-3 border-2 border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        返回大廳
      </button>

      <div className="text-xs text-slate-400 text-center uppercase tracking-widest flex flex-col gap-1">
        <span>您的身份: {localPlayer === 'black' ? '執黑 (先行)' : '執白 (後行)'}</span>
      </div>
    </div>
  );
};

export default GameInfo;
