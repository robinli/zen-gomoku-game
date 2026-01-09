
import React, { useState } from 'react';
import { Player } from '../types';
import RoomSettings, { GameSettings } from './RoomSettings';

interface LobbyProps {
  onCreate: (side: Player) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onCreate, settings, onSettingsChange }) => {
  const [selectedSide, setSelectedSide] = useState<Player>('black');

  return (
    <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center space-y-8 animate-in slide-in-from-bottom duration-700 border border-slate-100">
      <div className="space-y-2">
        <div className="w-16 h-16 bg-slate-900 rounded-full mx-auto flex items-center justify-center shadow-lg">
          <div className="w-8 h-8 border-4 border-white rounded-full"></div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-4 text-slate-900">靜弈五子棋</h2>
        <p className="text-slate-500 px-4">建立遊戲房間，選擇您的棋子顏色，並邀請好友進行對弈。</p>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">選擇您的立場</label>
        <div className="flex justify-center gap-6">
          <button
            onClick={() => setSelectedSide('black')}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${selectedSide === 'black' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSide === 'black' ? 'border-white/30 bg-slate-800' : 'border-slate-200 bg-slate-200'
              }`}>
              <div className="w-6 h-6 rounded-full bg-slate-950 shadow-inner"></div>
            </div>
            <span className="text-sm font-bold">執黑 (先行)</span>
            {selectedSide === 'black' && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>}
          </button>

          <button
            onClick={() => setSelectedSide('white')}
            className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${selectedSide === 'white' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
          >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSide === 'white' ? 'border-white/30 bg-slate-800' : 'border-slate-200 bg-white'
              }`}>
              <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
            </div>
            <span className="text-sm font-bold">執白 (後行)</span>
            {selectedSide === 'white' && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>}
          </button>
        </div>
      </div>

      {/* 遊戲設定 */}
      <RoomSettings settings={settings} onChange={onSettingsChange} />

      <button
        onClick={() => onCreate(selectedSide)}
        className="w-full py-4 bg-slate-900 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-slate-800 transform transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 group"
      >
        <span>創建遊戲房間</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">說明</span></div>
      </div>

      <div className="text-sm text-slate-500 italic">
        <p>若您已有好友分享的連結，<br />直接點擊該連結即可加入遊戲。</p>
      </div>
    </div>
  );
};

export default Lobby;
