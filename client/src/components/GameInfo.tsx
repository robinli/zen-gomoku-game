
import React, { useState } from 'react';
import { GameRoom, Player } from '../types';

interface GameInfoProps {
  room: GameRoom;
  localPlayer: Player | null;
  onReset: () => void;
  onGoHome: () => void;
  onRequestUndo: () => void;
  isConnected: boolean;
  isReconnecting?: boolean;
  isWaitingUndo?: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({ room, localPlayer, onReset, onGoHome, onRequestUndo, isConnected, isReconnecting, isWaitingUndo }) => {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const shareLink = window.location.href;

  // 檢查是否支援 Web Share API
  const canShare = typeof navigator !== 'undefined' && navigator.share !== undefined;

  // Web Share API 分享
  const handleShare = async () => {
    try {
      // 只傳 URL，讓社交平台自動抓取 Open Graph 標籤
      await navigator.share({
        title: '靜弈五子棋',
        text: '快來跟我下五子棋！',
        url: shareLink
      });
      setShareStatus('success');
      setTimeout(() => setShareStatus('idle'), 2000);
      console.log('✅ 分享成功');
    } catch (error: any) {
      // 用戶取消分享不算錯誤
      if (error.name !== 'AbortError') {
        console.error('❌ 分享失敗:', error);
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 2000);
        // 降級到複製連結
        handleCopy();
      }
    }
  };

  // 複製到剪貼簿
  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // 如果 clipboard API 也不支援，使用 prompt
        prompt('請複製此連結:', shareLink);
      });
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
          <p className="text-sm text-white/80 mb-4 font-light leading-relaxed">
            {canShare
              ? '點擊下方按鈕分享連結給朋友，開始對弈。'
              : '請將此連結傳送給朋友，他們點擊後即可開始對弈。'}
          </p>
          <div className="flex flex-col gap-2">
            {/* Web Share API 按鈕（移動端優先） */}
            {canShare && (
              <button
                onClick={handleShare}
                className={`mt-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${shareStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-slate-900 hover:bg-slate-100 active:scale-95'
                  }`}
              >
                {shareStatus === 'success' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    分享成功
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    分享邀請連結
                  </>
                )}
              </button>
            )}

            {/* 複製按鈕（備用方案或桌面端） */}
            <button
              onClick={handleCopy}
              className={`${canShare ? '' : 'mt-2'} w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${copied
                ? 'bg-green-500 text-white'
                : canShare
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  已複製連結
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  {canShare ? '或複製連結' : '複製分享連結'}
                </>
              )}
            </button>
            {/* 分享連結 */}
            <div className="bg-white/10 rounded-lg px-3 py-2 text-xs font-mono break-all border border-white/10">
              {shareLink}
            </div>
          </div>

          {/* 提示訊息 */}
          {canShare && (
            <div className="mt-3 flex items-start gap-2 text-xs text-white/60">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="leading-relaxed">使用「分享」按鈕可保持連線不中斷</span>
            </div>
          )}
        </div>
      )}

      {/* 悔棋按鈕 */}
      {localPlayer && Object.keys(room.players).length === 2 && !room.winner && (
        <button
          onClick={onRequestUndo}
          disabled={!isConnected || isWaitingUndo || room.settings.undoLimit === 0}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border-2 ${isWaitingUndo
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-wait'
            : isConnected && room.settings.undoLimit !== 0
              ? 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
        >
          {isWaitingUndo ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 animate-spin">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>等待對方回應...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              <span>請求悔棋</span>
              {room.settings.undoLimit !== null && room.settings.undoLimit > 0 && (
                <span className="text-xs opacity-75">
                  ({room.undoCount[localPlayer]}/{room.settings.undoLimit})
                </span>
              )}
            </>
          )}
        </button>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        disabled={!isConnected}
        className={`w-full py-3 border-2 border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 hover:border-slate-400 flex items-center justify-center gap-2 ${!isConnected ? 'opacity-30 cursor-not-allowed' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
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
