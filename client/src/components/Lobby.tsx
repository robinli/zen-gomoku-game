
import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Player } from '../types';
import RoomSettings, { GameSettings } from './RoomSettings';
import { useAuth } from '../contexts/AuthContext';

interface LobbyProps {
  onCreate: (side: Player) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onCreate, settings, onSettingsChange }) => {
  const { t } = useTranslation();
  const { user, signOut, updateDisplayName } = useAuth();
  const [selectedSide, setSelectedSide] = useState<Player>('black');

  // 修改名稱相關狀態
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // 初始化 newName 當 user 改變時
  React.useEffect(() => {
    if (user?.displayName) {
      setNewName(user.displayName);
    }
  }, [user]);

  // 修改名稱
  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;

    setIsUpdating(true);
    try {
      await updateDisplayName(newName.trim());
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update name');
    } finally {
      setIsUpdating(false);
    }
  };

  // 登出
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center space-y-8 animate-in slide-in-from-bottom duration-700 border border-slate-100">

      {/* User Profile Section */}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md">
            {user?.displayName ? user.displayName[0].toUpperCase() : 'G'}
          </div>

          <div className="flex flex-col items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{t('lobby.welcome')}</span>

            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-24 text-sm px-1 py-0.5 border-b border-slate-300 focus:outline-none focus:border-slate-900 bg-transparent"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                />
                <button
                  onClick={handleUpdateName}
                  disabled={isUpdating}
                  className="text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="font-bold text-slate-700 text-sm max-w-[120px] truncate">
                  {user?.displayName || 'Guest'}
                </span>
                {user && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {user ? (
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:bg-slate-200 hover:text-red-500 rounded-lg transition-colors"
            title={t('lobby.sign_out')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        ) : (
          <div className="text-xs text-slate-400 italic">
            {/* 未登入時可以放其他東西或保持空白 */}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-4 text-slate-900">{t('lobby.title')}</h2>
        <p className="text-slate-500 px-4">{t('lobby.description')}</p>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t('lobby.choose_side')}</label>
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
            <span className="text-sm font-bold">{t('lobby.black_side')}</span>
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
            <span className="text-sm font-bold">{t('lobby.white_side')}</span>
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
        <span>{t('lobby.create_room')}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">{t('lobby.instructions_badge')}</span></div>
      </div>

      <div className="text-sm text-slate-500 italic">
        <p>
          <Trans i18nKey="lobby.instructions_text" components={{ br: <br /> }} />
        </p>
      </div>
    </div>
  );
};

export default Lobby;
