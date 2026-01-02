
import React, { useState } from 'react';
import { GameRoom, Player } from '../types';

interface GameInfoProps {
  room: GameRoom;
  localPlayer: Player | null;
  onReset: () => void;
  isConnected: boolean;
  isReconnecting?: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({ room, localPlayer, onReset, isConnected, isReconnecting }) => {
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
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">連線狀態</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
          <span className={`text-sm font-medium ${isReconnecting ? 'text-amber-600' : 'text-slate-600'}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className={`bg-white p-6 rounded-2xl shadow-md border border-slate-100 transition-opacity ${(!isConnected && !isReconnecting) ? 'opacity-50' : 'opacity-100'}`}>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">當前回合</h3>
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
              {isReconnecting ? '連線中斷中...' : (localPlayer === room.turn ? '您的回合' : '等待對方下子...')}
            </p>
          </div>
        </div>
      </div>

      {/* Share Section - 只在等待對手加入時顯示 */}
      {Object.keys(room.players).length < 2 && !isReconnecting && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white animate-in zoom-in duration-500">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">邀請好友</h3>
          <p className="text-sm text-white/80 mb-4 font-light leading-relaxed">請將此連結傳送給另一台電腦的朋友，他們點擊後即可開始對弈。</p>
          <div className="flex flex-col gap-2">
            <div className="bg-white/10 rounded-lg px-3 py-2 text-[11px] font-mono break-all border border-white/10">
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

      <div className="text-[10px] text-slate-400 text-center uppercase tracking-widest flex flex-col gap-1">
        <span>房間代碼: {room.id}</span>
        <span>您的身份: {localPlayer === 'black' ? '執黑 (先行)' : '執白 (後行)'}</span>
      </div>
    </div>
  );
};

export default GameInfo;
